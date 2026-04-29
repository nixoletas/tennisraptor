import { create } from 'zustand';
import { Match, LiveMatchState, MatchSet, Surface, MatchFormat } from '../constants/types';
import { supabase } from '../lib/supabase';
import { newId, matchFromRow, MatchRow } from '../lib/db';

function checkSetDone(p1: number, p2: number): boolean {
  if (p1 >= 6 || p2 >= 6) {
    if (Math.abs(p1 - p2) >= 2) return true;
    if (p1 === 7 || p2 === 7) return true;
  }
  return false;
}

function isTiebreakNeeded(p1: number, p2: number): boolean {
  return p1 === 6 && p2 === 6;
}

interface MatchStore {
  matches: Match[];
  liveMatch: LiveMatchState | null;
  loaded: boolean;

  loadAll: (userId: string) => Promise<void>;
  reset: () => void;

  logMatch: (data: Omit<Match, 'id' | 'createdAt' | 'status'>) => Promise<Match | null>;
  deleteMatch: (id: string) => Promise<void>;
  updateMatch: (id: string, updates: Partial<Match>) => Promise<void>;
  approveMatch: (id: string) => Promise<void>;
  rejectMatch: (id: string) => Promise<void>;

  startLive: (p1Id: string, p2Id: string, surface: Surface, format: MatchFormat) => void;
  awardGame: (winnerId: string) => void;
  awardTiebreakPoint: (winnerId: string) => void;
  finishLive: () => Promise<Match | null>;
  cancelLive: () => void;

  getPendingForMe: (myId: string) => Match[];
  getPlayerMatches: (playerId: string) => Match[];
  getPlayerStats: (playerId: string) => {
    wins: number; losses: number;
    setsWon: number; setsLost: number;
    gamesWon: number; gamesLost: number;
    winRate: number;
  };
}

export const useMatchStore = create<MatchStore>()((set, get) => ({
  matches: [],
  liveMatch: null,
  loaded: false,

  loadAll: async (userId) => {
    // RLS já filtra: owner OU P1 OU P2. Pega todas que o user vê.
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`owner_id.eq.${userId},player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[matches] loadAll', error);
      return;
    }

    set({ matches: (data as MatchRow[]).map(matchFromRow), loaded: true });
  },

  reset: () => set({ matches: [], liveMatch: null, loaded: false }),

  logMatch: async (data) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;

    // Auto-confirm se o owner é o próprio P2 (caso raro: user registra match
    // onde ele mesmo é o adversário). Default = pending pra approval flow.
    const autoConfirmed = userId === data.player2Id;

    const match: Match = {
      ...data,
      id: newId(),
      status: autoConfirmed ? 'confirmed' : 'pending',
      confirmedAt: autoConfirmed ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('matches').insert({
      id: match.id,
      owner_id: userId,
      date: match.date,
      scheduled_time: match.scheduledTime ?? null,
      location: match.location ?? null,
      banner_url: match.bannerUrl ?? null,
      player1_id: match.player1Id,
      player2_id: match.player2Id,
      winner_id: match.winnerId,
      sets: match.sets,
      surface: match.surface,
      format: match.format,
      status: match.status,
      confirmed_at: match.confirmedAt ?? null,
      notes: match.notes ?? null,
      duration_minutes: match.duration ?? null,
    });

    if (error) {
      console.error('[matches] logMatch', error);
      return null;
    }

    set(s => ({ matches: [match, ...s.matches] }));
    return match;
  },

  approveMatch: async (id) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('matches')
      .update({ status: 'confirmed', confirmed_at: now })
      .eq('id', id);
    if (error) {
      console.error('[matches] approveMatch', error);
      return;
    }
    set(s => ({
      matches: s.matches.map(m => m.id === id
        ? { ...m, status: 'confirmed', confirmedAt: now }
        : m),
    }));
  },

  rejectMatch: async (id) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('matches')
      .update({ status: 'rejected', rejected_at: now })
      .eq('id', id);
    if (error) {
      console.error('[matches] rejectMatch', error);
      return;
    }
    set(s => ({
      matches: s.matches.map(m => m.id === id
        ? { ...m, status: 'rejected', rejectedAt: now }
        : m),
    }));
  },

  deleteMatch: async (id) => {
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) {
      console.error('[matches] deleteMatch', error);
      return;
    }
    set(s => ({ matches: s.matches.filter(m => m.id !== id) }));
  },

  updateMatch: async (id, updates) => {
    const patch: Record<string, unknown> = {};
    if (updates.date !== undefined) patch.date = updates.date;
    if (updates.winnerId !== undefined) patch.winner_id = updates.winnerId;
    if (updates.sets !== undefined) patch.sets = updates.sets;
    if (updates.surface !== undefined) patch.surface = updates.surface;
    if (updates.format !== undefined) patch.format = updates.format;
    if (updates.notes !== undefined) patch.notes = updates.notes ?? null;
    if (updates.duration !== undefined) patch.duration_minutes = updates.duration ?? null;

    const { error } = await supabase.from('matches').update(patch).eq('id', id);
    if (error) {
      console.error('[matches] updateMatch', error);
      return;
    }

    set(s => ({
      matches: s.matches.map(m => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  // ---- Live match (transient, client-only until finishLive) ----
  startLive: (p1Id, p2Id, surface, format) => {
    const live: LiveMatchState = {
      matchId: newId(),
      player1Id: p1Id,
      player2Id: p2Id,
      surface,
      format,
      sets: [],
      currentSet: 0,
      p1CurrentGames: 0,
      p2CurrentGames: 0,
      p1Points: 0,
      p2Points: 0,
      isDeuce: false,
      p1Adv: false,
      p2Adv: false,
      isTiebreak: false,
      p1TiebreakPoints: 0,
      p2TiebreakPoints: 0,
      isComplete: false,
      winnerId: null,
      startedAt: new Date().toISOString(),
    };
    set({ liveMatch: live });
  },

  awardGame: (winnerId) => {
    const live = get().liveMatch;
    if (!live || live.isComplete || live.isTiebreak) return;

    const isP1 = winnerId === live.player1Id;
    let p1g = live.p1CurrentGames + (isP1 ? 1 : 0);
    let p2g = live.p2CurrentGames + (isP1 ? 0 : 1);

    const newSets = [...live.sets];
    let isComplete: boolean = live.isComplete;
    let matchWinner: string | null = null;
    let isTiebreak = false;
    let newCurrentSet = live.currentSet;

    if (checkSetDone(p1g, p2g)) {
      newSets[live.currentSet] = { p1: p1g, p2: p2g };
      p1g = 0;
      p2g = 0;
      newCurrentSet++;

      const maxSets = live.format === 'best_of_5' ? 3 : 2;
      const p1Sets = newSets.filter(s => s.p1 > s.p2).length;
      const p2Sets = newSets.filter(s => s.p2 > s.p1).length;
      if (p1Sets >= maxSets) {
        isComplete = true;
        matchWinner = live.player1Id;
      } else if (p2Sets >= maxSets) {
        isComplete = true;
        matchWinner = live.player2Id;
      }
    } else if (isTiebreakNeeded(p1g, p2g)) {
      isTiebreak = true;
    }

    set({
      liveMatch: {
        ...live,
        sets: newSets,
        currentSet: newCurrentSet,
        p1CurrentGames: p1g,
        p2CurrentGames: p2g,
        p1Points: 0,
        p2Points: 0,
        isDeuce: false,
        p1Adv: false,
        p2Adv: false,
        isTiebreak,
        isComplete,
        winnerId: matchWinner,
      },
    });
  },

  awardTiebreakPoint: (winnerId) => {
    const live = get().liveMatch;
    if (!live || !live.isTiebreak) return;

    const isP1 = winnerId === live.player1Id;
    let p1tb = live.p1TiebreakPoints + (isP1 ? 1 : 0);
    let p2tb = live.p2TiebreakPoints + (isP1 ? 0 : 1);

    const tbDone =
      (p1tb >= 7 || p2tb >= 7) && Math.abs(p1tb - p2tb) >= 2;

    if (tbDone) {
      const p1g = live.p1CurrentGames + (isP1 ? 1 : 0);
      const p2g = live.p2CurrentGames + (isP1 ? 0 : 1);
      const newSets = [...live.sets];
      newSets[live.currentSet] = { p1: p1g, p2: p2g, tiebreak: { p1: p1tb, p2: p2tb } };

      const maxSets = live.format === 'best_of_5' ? 3 : 2;
      const p1Sets = newSets.filter(s => s.p1 > s.p2).length;
      const p2Sets = newSets.filter(s => s.p2 > s.p1).length;
      const isComplete = p1Sets >= maxSets || p2Sets >= maxSets;
      const matchWinner = p1Sets >= maxSets ? live.player1Id : p2Sets >= maxSets ? live.player2Id : null;

      set({
        liveMatch: {
          ...live,
          sets: newSets,
          currentSet: live.currentSet + 1,
          p1CurrentGames: 0,
          p2CurrentGames: 0,
          p1TiebreakPoints: 0,
          p2TiebreakPoints: 0,
          isTiebreak: false,
          isComplete,
          winnerId: matchWinner,
        },
      });
    } else {
      set({ liveMatch: { ...live, p1TiebreakPoints: p1tb, p2TiebreakPoints: p2tb } });
    }
  },

  finishLive: async () => {
    const live = get().liveMatch;
    if (!live) return null;

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;

    const autoConfirmed = userId === live.player2Id;
    const now = new Date().toISOString();

    const match: Match = {
      id: live.matchId,
      date: live.startedAt.split('T')[0],
      player1Id: live.player1Id,
      player2Id: live.player2Id,
      winnerId: live.winnerId,
      sets: live.sets,
      surface: live.surface,
      format: live.format,
      status: autoConfirmed ? 'confirmed' : 'pending',
      confirmedAt: autoConfirmed ? now : undefined,
      createdAt: now,
      duration: Math.round((Date.now() - new Date(live.startedAt).getTime()) / 60000),
    };

    const { error } = await supabase.from('matches').insert({
      id: match.id,
      owner_id: userId,
      date: match.date,
      player1_id: match.player1Id,
      player2_id: match.player2Id,
      winner_id: match.winnerId,
      sets: match.sets,
      surface: match.surface,
      format: match.format,
      status: match.status,
      confirmed_at: match.confirmedAt ?? null,
      duration_minutes: match.duration,
    });

    if (error) {
      console.error('[matches] finishLive', error);
      return null;
    }

    set(s => ({ matches: [match, ...s.matches], liveMatch: null }));
    return match;
  },

  cancelLive: () => {
    set({ liveMatch: null });
  },

  getPendingForMe: (myId) => {
    return get().matches.filter(
      m => m.player2Id === myId && m.status === 'pending'
    );
  },

  // Só matches confirmed contam pra histórico/stats (gym-rats: precisa do OK do P2).
  getPlayerMatches: (playerId) => {
    return get().matches.filter(
      m => m.status === 'confirmed'
        && (m.player1Id === playerId || m.player2Id === playerId)
    );
  },

  getPlayerStats: (playerId) => {
    const matches = get().getPlayerMatches(playerId);
    let wins = 0, losses = 0, setsWon = 0, setsLost = 0, gamesWon = 0, gamesLost = 0;

    for (const m of matches) {
      if (!m.winnerId) continue;
      const won = m.winnerId === playerId;
      if (won) wins++; else losses++;

      const isP1 = m.player1Id === playerId;
      for (const s of m.sets) {
        const sg = isP1 ? s.p1 : s.p2;
        const sl = isP1 ? s.p2 : s.p1;
        gamesWon += sg;
        gamesLost += sl;
        if (sg > sl) setsWon++; else setsLost++;
      }
    }

    const total = wins + losses;
    return { wins, losses, setsWon, setsLost, gamesWon, gamesLost, winRate: total ? wins / total : 0 };
  },
}));
