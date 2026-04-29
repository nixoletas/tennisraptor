export type Surface = 'clay' | 'hard' | 'grass' | 'carpet' | 'indoor';
export type MatchFormat = 'best_of_3' | 'best_of_5' | 'pro_set';
export type TournamentFormat = 'round_robin' | 'single_elim' | 'groups';
export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface MatchSet {
  p1: number;
  p2: number;
  tiebreak?: { p1: number; p2: number };
}

export interface Match {
  id: string;
  date: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  sets: MatchSet[];
  surface: Surface;
  format: MatchFormat;
  tournamentId?: string;
  groupId?: string;
  notes?: string;
  duration?: number;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  handle?: string;
  avatarColor: string;
  createdAt: string;
  isMe?: boolean;
}

export interface H2HStats {
  p1Wins: number;
  p2Wins: number;
  p1SetsWon: number;
  p2SetsWon: number;
  p1GamesWon: number;
  p2GamesWon: number;
  matches: Match[];
  lastMet?: string;
}

export interface Standing {
  playerId: string;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
  matchesPlayed: number;
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  surface: Surface;
  startDate: string;
  endDate?: string;
  playerIds: string[];
  status: TournamentStatus;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  adminId: string | null;
  createdAt: string;
}

// Live match tracking state — client-only, not persisted to DB until match ends.
export interface LiveMatchState {
  matchId: string;
  player1Id: string;
  player2Id: string;
  surface: Surface;
  format: MatchFormat;
  sets: MatchSet[];
  currentSet: number;
  p1CurrentGames: number;
  p2CurrentGames: number;
  p1Points: number;
  p2Points: number;
  isDeuce: boolean;
  p1Adv: boolean;
  p2Adv: boolean;
  isTiebreak: boolean;
  p1TiebreakPoints: number;
  p2TiebreakPoints: number;
  isComplete: boolean;
  winnerId: string | null;
  startedAt: string;
}
