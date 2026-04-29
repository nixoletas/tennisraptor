import { create } from 'zustand';
import { Player, Profile, H2HStats, Match } from '../constants/types';
import { supabase } from '../lib/supabase';
import { newId, playerFromRow, profileFromRow, PlayerRow, ProfileRow } from '../lib/db';

const AVATAR_COLORS = [
  '#FF6B6B', '#FF9F0A', '#D4FF00', '#30D158', '#0A84FF',
  '#BF5AF2', '#FF375F', '#64D2FF', '#FFD60A', '#32D74B',
];

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

interface PlayerStore {
  players: Player[];
  myPlayerId: string | null;
  platformProfiles: Profile[];
  loaded: boolean;

  loadAll: (userId: string) => Promise<void>;
  loadPlatform: (currentUserId: string) => Promise<void>;
  reset: () => void;

  addPlayer: (name: string, handle?: string) => Promise<Player | null>;
  updatePlayer: (id: string, updates: Partial<Pick<Player, 'name' | 'handle'>>) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  setupMe: (userId: string, name: string, handle?: string) => Promise<Player | null>;

  getH2H: (p1Id: string, p2Id: string, matches: Match[]) => H2HStats;
}

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  players: [],
  myPlayerId: null,
  platformProfiles: [],
  loaded: false,

  loadAll: async (userId) => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[players] loadAll', error);
      return;
    }

    const players = (data as PlayerRow[]).map(playerFromRow);
    const me = players.find(p => p.isMe);
    set({ players, myPlayerId: me?.id ?? null, loaded: true });
  },

  loadPlatform: async (currentUserId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,handle,avatar_color,created_at')
      .neq('id', currentUserId)
      .order('name', { ascending: true });

    if (error) {
      console.error('[profiles] loadPlatform', error);
      return;
    }

    set({ platformProfiles: (data as ProfileRow[]).map(profileFromRow) });
  },

  reset: () => set({ players: [], myPlayerId: null, platformProfiles: [], loaded: false }),

  addPlayer: async (name, handle) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;

    const player: Player = {
      id: newId(),
      name,
      handle,
      avatarColor: avatarColor(get().players.length),
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('players').insert({
      id: player.id,
      owner_id: userId,
      name: player.name,
      handle: player.handle ?? null,
      avatar_color: player.avatarColor,
      is_me: false,
    });

    if (error) {
      console.error('[players] addPlayer', error);
      return null;
    }

    set(s => ({ players: [...s.players, player] }));
    return player;
  },

  setupMe: async (userId, name, handle) => {
    const existing = get().players.find(p => p.isMe);

    if (existing) {
      const { error } = await supabase
        .from('players')
        .update({ name, handle: handle ?? null })
        .eq('id', existing.id);

      if (error) {
        console.error('[players] setupMe update', error);
        return null;
      }

      const updated: Player = { ...existing, name, handle };
      set(s => ({ players: s.players.map(p => p.id === existing.id ? updated : p) }));
      return updated;
    }

    const player: Player = {
      id: newId(),
      name,
      handle,
      avatarColor: AVATAR_COLORS[0],
      isMe: true,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('players').insert({
      id: player.id,
      owner_id: userId,
      name: player.name,
      handle: player.handle ?? null,
      avatar_color: player.avatarColor,
      is_me: true,
    });

    if (error) {
      console.error('[players] setupMe insert', error);
      return null;
    }

    set(s => ({ players: [...s.players, player], myPlayerId: player.id }));
    return player;
  },

  updatePlayer: async (id, updates) => {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.handle !== undefined) patch.handle = updates.handle ?? null;

    const { error } = await supabase.from('players').update(patch).eq('id', id);
    if (error) {
      console.error('[players] updatePlayer', error);
      return;
    }

    set(s => ({
      players: s.players.map(p => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  removePlayer: async (id) => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) {
      console.error('[players] removePlayer', error);
      return;
    }
    set(s => ({
      players: s.players.filter(p => p.id !== id),
      myPlayerId: s.myPlayerId === id ? null : s.myPlayerId,
    }));
  },

  getH2H: (p1Id, p2Id, matches) => {
    const h2h = matches.filter(
      m =>
        m.winnerId &&
        ((m.player1Id === p1Id && m.player2Id === p2Id) ||
          (m.player1Id === p2Id && m.player2Id === p1Id))
    );

    let p1Wins = 0, p2Wins = 0;
    let p1SetsWon = 0, p2SetsWon = 0;
    let p1GamesWon = 0, p2GamesWon = 0;

    for (const m of h2h) {
      const p1IsPlayer1 = m.player1Id === p1Id;
      if (m.winnerId === p1Id) p1Wins++;
      else p2Wins++;

      for (const s of m.sets) {
        const sg1 = p1IsPlayer1 ? s.p1 : s.p2;
        const sg2 = p1IsPlayer1 ? s.p2 : s.p1;
        p1GamesWon += sg1;
        p2GamesWon += sg2;
        if (sg1 > sg2) p1SetsWon++;
        else if (sg2 > sg1) p2SetsWon++;
      }
    }

    return {
      p1Wins, p2Wins, p1SetsWon, p2SetsWon, p1GamesWon, p2GamesWon,
      matches: h2h,
      lastMet: h2h[0]?.date,
    };
  },
}));
