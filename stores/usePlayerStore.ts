import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, H2HStats, Match } from '../constants/types';

const AVATAR_COLORS = [
  '#FF6B6B', '#FF9F0A', '#D4FF00', '#30D158', '#0A84FF',
  '#BF5AF2', '#FF375F', '#64D2FF', '#FFD60A', '#32D74B',
];

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

interface PlayerStore {
  players: Player[];
  myPlayerId: string | null;
  addPlayer: (name: string, handle?: string) => Player;
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => void;
  removePlayer: (id: string) => void;
  setMe: (id: string) => void;
  setupMe: (name: string, handle?: string) => Player;
  getH2H: (p1Id: string, p2Id: string, matches: Match[]) => H2HStats;
  recordResult: (playerId: string, won: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      players: [],
      myPlayerId: null,

      addPlayer: (name, handle) => {
        const player: Player = {
          id: genId(),
          name,
          handle,
          rating: 3.0,
          avatarColor: avatarColor(get().players.length),
          wins: 0,
          losses: 0,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ players: [...s.players, player] }));
        return player;
      },

      setupMe: (name, handle) => {
        const existing = get().players.find(p => p.isMe);
        if (existing) {
          get().updatePlayer(existing.id, { name, handle });
          return existing;
        }
        const player: Player = {
          id: genId(),
          name,
          handle,
          rating: 3.0,
          avatarColor: AVATAR_COLORS[0],
          wins: 0,
          losses: 0,
          createdAt: new Date().toISOString(),
          isMe: true,
        };
        set(s => ({ players: [...s.players, player], myPlayerId: player.id }));
        return player;
      },

      updatePlayer: (id, updates) => {
        set(s => ({
          players: s.players.map(p => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      removePlayer: (id) => {
        set(s => ({ players: s.players.filter(p => p.id !== id) }));
      },

      setMe: (id) => {
        set(s => ({
          myPlayerId: id,
          players: s.players.map(p => ({ ...p, isMe: p.id === id })),
        }));
      },

      recordResult: (playerId, won) => {
        set(s => ({
          players: s.players.map(p =>
            p.id === playerId
              ? { ...p, wins: p.wins + (won ? 1 : 0), losses: p.losses + (won ? 0 : 1) }
              : p
          ),
        }));
      },

      getH2H: (p1Id, p2Id, matches) => {
        const h2h = matches.filter(
          m =>
            !m.isLive &&
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
    }),
    {
      name: 'player-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
