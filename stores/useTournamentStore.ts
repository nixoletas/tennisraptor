import { create } from 'zustand';
import { Tournament, Group, Standing, Match, TournamentFormat, Surface } from '../constants/types';
import { supabase } from '../lib/supabase';
import { newId, tournamentFromRow, groupFromRow, TournamentRow, GroupRow } from '../lib/db';

function computeStandings(playerIds: string[], matches: Match[]): Standing[] {
  const map = new Map<string, Standing>();

  for (const pid of playerIds) {
    map.set(pid, {
      playerId: pid, wins: 0, losses: 0,
      setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0,
      points: 0, matchesPlayed: 0,
    });
  }

  for (const m of matches) {
    if (!m.winnerId) continue;
    const p1 = map.get(m.player1Id);
    const p2 = map.get(m.player2Id);
    if (!p1 || !p2) continue;

    p1.matchesPlayed++;
    p2.matchesPlayed++;

    if (m.winnerId === m.player1Id) {
      p1.wins++; p1.points += 3;
      p2.losses++;
    } else {
      p2.wins++; p2.points += 3;
      p1.losses++;
    }

    for (const s of m.sets) {
      p1.setsWon += s.p1 > s.p2 ? 1 : 0;
      p1.setsLost += s.p2 > s.p1 ? 1 : 0;
      p2.setsWon += s.p2 > s.p1 ? 1 : 0;
      p2.setsLost += s.p1 > s.p2 ? 1 : 0;
      p1.gamesWon += s.p1; p1.gamesLost += s.p2;
      p2.gamesWon += s.p2; p2.gamesLost += s.p1;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiff = a.setsWon - a.setsLost;
    const bDiff = b.setsWon - b.setsLost;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
  });
}

interface TournamentStore {
  tournaments: Tournament[];
  groups: Group[];
  loaded: boolean;

  loadAll: (userId: string) => Promise<void>;
  reset: () => void;

  createTournament: (data: {
    name: string; format: TournamentFormat; surface: Surface;
    startDate: string; playerIds: string[];
  }) => Promise<Tournament | null>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  setStatus: (id: string, status: Tournament['status']) => Promise<void>;

  createGroup: (name: string, memberIds: string[], adminId: string) => Promise<Group | null>;
  updateGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addToGroup: (groupId: string, playerId: string) => Promise<void>;
  removeFromGroup: (groupId: string, playerId: string) => Promise<void>;

  getStandings: (tournamentId: string, allMatches: Match[]) => Standing[];
  getGroupStandings: (groupId: string, allMatches: Match[]) => Standing[];
}

export const useTournamentStore = create<TournamentStore>()((set, get) => ({
  tournaments: [],
  groups: [],
  loaded: false,

  loadAll: async (userId) => {
    const [tRes, tpRes, gRes, gmRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
      supabase.from('tournament_players').select('tournament_id,player_id'),
      supabase.from('groups').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
      supabase.from('group_members').select('group_id,player_id'),
    ]);

    if (tRes.error) console.error('[tournaments] load', tRes.error);
    if (tpRes.error) console.error('[tournament_players] load', tpRes.error);
    if (gRes.error) console.error('[groups] load', gRes.error);
    if (gmRes.error) console.error('[group_members] load', gmRes.error);

    const tpByT = new Map<string, string[]>();
    for (const row of (tpRes.data ?? []) as { tournament_id: string; player_id: string }[]) {
      const arr = tpByT.get(row.tournament_id) ?? [];
      arr.push(row.player_id);
      tpByT.set(row.tournament_id, arr);
    }

    const gmByG = new Map<string, string[]>();
    for (const row of (gmRes.data ?? []) as { group_id: string; player_id: string }[]) {
      const arr = gmByG.get(row.group_id) ?? [];
      arr.push(row.player_id);
      gmByG.set(row.group_id, arr);
    }

    const tournaments = ((tRes.data ?? []) as TournamentRow[]).map(r =>
      tournamentFromRow(r, tpByT.get(r.id) ?? [])
    );
    const groups = ((gRes.data ?? []) as GroupRow[]).map(r =>
      groupFromRow(r, gmByG.get(r.id) ?? [])
    );

    set({ tournaments, groups, loaded: true });
  },

  reset: () => set({ tournaments: [], groups: [], loaded: false }),

  createTournament: async (data) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;

    const t: Tournament = {
      ...data,
      id: newId(),
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    };

    const { error: tErr } = await supabase.from('tournaments').insert({
      id: t.id,
      owner_id: userId,
      name: t.name,
      format: t.format,
      surface: t.surface,
      start_date: t.startDate,
      status: t.status,
    });
    if (tErr) {
      console.error('[tournaments] createTournament', tErr);
      return null;
    }

    if (t.playerIds.length > 0) {
      const { error: tpErr } = await supabase.from('tournament_players').insert(
        t.playerIds.map(pid => ({ tournament_id: t.id, player_id: pid }))
      );
      if (tpErr) console.error('[tournament_players] insert', tpErr);
    }

    set(s => ({ tournaments: [t, ...s.tournaments] }));
    return t;
  },

  updateTournament: async (id, updates) => {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.format !== undefined) patch.format = updates.format;
    if (updates.surface !== undefined) patch.surface = updates.surface;
    if (updates.startDate !== undefined) patch.start_date = updates.startDate;
    if (updates.endDate !== undefined) patch.end_date = updates.endDate ?? null;
    if (updates.status !== undefined) patch.status = updates.status;

    const { error } = await supabase.from('tournaments').update(patch).eq('id', id);
    if (error) {
      console.error('[tournaments] updateTournament', error);
      return;
    }

    set(s => ({
      tournaments: s.tournaments.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  deleteTournament: async (id) => {
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) {
      console.error('[tournaments] deleteTournament', error);
      return;
    }
    set(s => ({ tournaments: s.tournaments.filter(t => t.id !== id) }));
  },

  setStatus: async (id, status) => {
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', id);
    if (error) {
      console.error('[tournaments] setStatus', error);
      return;
    }
    set(s => ({
      tournaments: s.tournaments.map(t => (t.id === id ? { ...t, status } : t)),
    }));
  },

  createGroup: async (name, memberIds, adminId) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;

    const g: Group = {
      id: newId(), name, memberIds, adminId,
      createdAt: new Date().toISOString(),
    };

    const { error: gErr } = await supabase.from('groups').insert({
      id: g.id,
      owner_id: userId,
      name: g.name,
      admin_id: g.adminId,
    });
    if (gErr) {
      console.error('[groups] createGroup', gErr);
      return null;
    }

    if (memberIds.length > 0) {
      const { error: gmErr } = await supabase.from('group_members').insert(
        memberIds.map(pid => ({ group_id: g.id, player_id: pid }))
      );
      if (gmErr) console.error('[group_members] insert', gmErr);
    }

    set(s => ({ groups: [g, ...s.groups] }));
    return g;
  },

  updateGroup: async (id, updates) => {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.adminId !== undefined) patch.admin_id = updates.adminId;

    const { error } = await supabase.from('groups').update(patch).eq('id', id);
    if (error) {
      console.error('[groups] updateGroup', error);
      return;
    }
    set(s => ({
      groups: s.groups.map(g => (g.id === id ? { ...g, ...updates } : g)),
    }));
  },

  deleteGroup: async (id) => {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) {
      console.error('[groups] deleteGroup', error);
      return;
    }
    set(s => ({ groups: s.groups.filter(g => g.id !== id) }));
  },

  addToGroup: async (groupId, playerId) => {
    const g = get().groups.find(gr => gr.id === groupId);
    if (!g || g.memberIds.includes(playerId)) return;

    const { error } = await supabase.from('group_members')
      .insert({ group_id: groupId, player_id: playerId });
    if (error) {
      console.error('[group_members] addToGroup', error);
      return;
    }
    set(s => ({
      groups: s.groups.map(gr =>
        gr.id === groupId ? { ...gr, memberIds: [...gr.memberIds, playerId] } : gr
      ),
    }));
  },

  removeFromGroup: async (groupId, playerId) => {
    const { error } = await supabase.from('group_members').delete()
      .eq('group_id', groupId).eq('player_id', playerId);
    if (error) {
      console.error('[group_members] removeFromGroup', error);
      return;
    }
    set(s => ({
      groups: s.groups.map(gr =>
        gr.id === groupId ? { ...gr, memberIds: gr.memberIds.filter(id => id !== playerId) } : gr
      ),
    }));
  },

  getStandings: (tournamentId, allMatches) => {
    const t = get().tournaments.find(t => t.id === tournamentId);
    if (!t) return [];
    const matches = allMatches.filter(m => m.tournamentId === tournamentId);
    return computeStandings(t.playerIds, matches);
  },

  getGroupStandings: (groupId, allMatches) => {
    const g = get().groups.find(g => g.id === groupId);
    if (!g) return [];
    const matches = allMatches.filter(m => m.groupId === groupId);
    return computeStandings(g.memberIds, matches);
  },
}));
