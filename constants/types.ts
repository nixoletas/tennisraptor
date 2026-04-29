export type Surface = 'clay' | 'hard' | 'grass';
export type MatchFormat = 'best_of_3' | 'best_of_5' | 'pro_set';

export type DominantHand = 'right' | 'left';
export type PlayStyle = 'serve_volley' | 'defensive' | 'all_court' | 'offensive';
export type Environment = 'outdoor' | 'indoor';

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

// Authenticated user on the platform — extended profile (onboarding fields).
export interface Profile {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  avatarColor?: string;

  weightKg?: number;
  heightCm?: number;
  dominantHand?: DominantHand;

  playStyle?: PlayStyle;
  preferredEnvironment?: Environment;
  preferredSurface?: Surface;
  similarProId?: string;

  regionState?: string;
  regionCity?: string;

  instagramUrl?: string;
  linkedinUrl?: string;

  onboardingCompleted: boolean;
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
