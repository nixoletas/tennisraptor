import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tournament, Group, Standing, Match, TournamentFormat, Surface } from '../constants/types';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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
    if (!m.winnerId || m.isLive) continue;
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

  createTournament: (data: {
    name: string; format: TournamentFormat; surface: Surface;
    startDate: string; playerIds: string[];
  }) => Tournament;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;
  setStatus: (id: string, status: Tournament['status']) => void;

  createGroup: (name: string, memberIds: string[], adminId: string) => Group;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addToGroup: (groupId: string, playerId: string) => void;
  removeFromGroup: (groupId: string, playerId: string) => void;

  getStandings: (tournamentId: string, allMatches: Match[]) => Standing[];
  getGroupStandings: (groupId: string, allMatches: Match[]) => Standing[];
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournaments: [],
      groups: [],

      createTournament: (data) => {
        const t: Tournament = {
          ...data,
          id: genId(),
          status: 'upcoming',
          createdAt: new Date().toISOString(),
        };
        set(s => ({ tournaments: [t, ...s.tournaments] }));
        return t;
      },

      updateTournament: (id, updates) => {
        set(s => ({
          tournaments: s.tournaments.map(t => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTournament: (id) => {
        set(s => ({ tournaments: s.tournaments.filter(t => t.id !== id) }));
      },

      setStatus: (id, status) => {
        set(s => ({
          tournaments: s.tournaments.map(t => (t.id === id ? { ...t, status } : t)),
        }));
      },

      createGroup: (name, memberIds, adminId) => {
        const g: Group = {
          id: genId(), name, memberIds, adminId,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ groups: [g, ...s.groups] }));
        return g;
      },

      updateGroup: (id, updates) => {
        set(s => ({
          groups: s.groups.map(g => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGroup: (id) => {
        set(s => ({ groups: s.groups.filter(g => g.id !== id) }));
      },

      addToGroup: (groupId, playerId) => {
        set(s => ({
          groups: s.groups.map(g =>
            g.id === groupId && !g.memberIds.includes(playerId)
              ? { ...g, memberIds: [...g.memberIds, playerId] }
              : g
          ),
        }));
      },

      removeFromGroup: (groupId, playerId) => {
        set(s => ({
          groups: s.groups.map(g =>
            g.id === groupId
              ? { ...g, memberIds: g.memberIds.filter(id => id !== playerId) }
              : g
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
    }),
    {
      name: 'tournament-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
