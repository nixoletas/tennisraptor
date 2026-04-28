import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match, LiveMatchState, MatchSet, Surface, MatchFormat } from '../constants/types';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const POINT_LABELS = ['0', '15', '30', '40'];

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

  logMatch: (data: Omit<Match, 'id' | 'createdAt' | 'isLive'>) => Match;
  deleteMatch: (id: string) => void;
  updateMatch: (id: string, updates: Partial<Match>) => void;

  startLive: (p1Id: string, p2Id: string, surface: Surface, format: MatchFormat) => void;
  awardGame: (winnerId: string) => void;
  awardTiebreakPoint: (winnerId: string) => void;
  undoLastGame: () => void;
  finishLive: () => Match | null;
  cancelLive: () => void;

  getPlayerMatches: (playerId: string) => Match[];
  getPlayerStats: (playerId: string) => {
    wins: number; losses: number;
    setsWon: number; setsLost: number;
    gamesWon: number; gamesLost: number;
    winRate: number;
  };
}

export const useMatchStore = create<MatchStore>()(
  persist(
    (set, get) => ({
      matches: [],
      liveMatch: null,

      logMatch: (data) => {
        const match: Match = {
          ...data,
          id: genId(),
          isLive: false,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ matches: [match, ...s.matches] }));
        return match;
      },

      deleteMatch: (id) => {
        set(s => ({ matches: s.matches.filter(m => m.id !== id) }));
      },

      updateMatch: (id, updates) => {
        set(s => ({
          matches: s.matches.map(m => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      startLive: (p1Id, p2Id, surface, format) => {
        const live: LiveMatchState = {
          matchId: genId(),
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
        let isComplete = live.isComplete;
        let matchWinner: string | null = null;
        let isTiebreak = false;
        let newCurrentSet = live.currentSet;

        if (checkSetDone(p1g, p2g)) {
          newSets[live.currentSet] = { p1: p1g, p2: p2g };
          p1g = 0;
          p2g = 0;
          newCurrentSet++;

          // Check match win
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

      undoLastGame: () => {
        // TODO: implement undo stack
      },

      finishLive: () => {
        const live = get().liveMatch;
        if (!live) return null;

        const match: Match = {
          id: live.matchId,
          date: live.startedAt.split('T')[0],
          player1Id: live.player1Id,
          player2Id: live.player2Id,
          winnerId: live.winnerId,
          sets: live.sets,
          surface: live.surface,
          format: live.format,
          isLive: false,
          createdAt: new Date().toISOString(),
          duration: Math.round((Date.now() - new Date(live.startedAt).getTime()) / 60000),
        };

        set(s => ({ matches: [match, ...s.matches], liveMatch: null }));
        return match;
      },

      cancelLive: () => {
        set({ liveMatch: null });
      },

      getPlayerMatches: (playerId) => {
        return get().matches.filter(
          m => !m.isLive && (m.player1Id === playerId || m.player2Id === playerId)
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
    }),
    {
      name: 'match-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
