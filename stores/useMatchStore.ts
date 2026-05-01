import { create } from 'zustand';
import { Match } from '../constants/types';
import { supabase } from '../lib/supabase';
import { newId, matchFromRow, MatchRow } from '../lib/db';

interface MatchStore {
  matches: Match[];
  loaded: boolean;

  loadAll: (userId: string) => Promise<void>;
  reset: () => void;

  logMatch: (data: Omit<Match, 'id' | 'createdAt' | 'status'>) => Promise<Match | null>;
  deleteMatch: (id: string) => Promise<void>;
  updateMatch: (id: string, updates: Partial<Match>) => Promise<void>;
  approveMatch: (id: string) => Promise<void>;
  rejectMatch: (id: string) => Promise<void>;

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

  reset: () => set({ matches: [], loaded: false }),

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
