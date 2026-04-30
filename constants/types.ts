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

export type MatchStatus = 'pending' | 'confirmed' | 'rejected';

export interface Match {
  id: string;
  date: string;
  scheduledTime?: string;
  location?: string;
  bannerUrl?: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  sets: MatchSet[];
  surface: Surface;
  format: MatchFormat;
  status: MatchStatus;
  confirmedAt?: string;
  rejectedAt?: string;
  notes?: string;
  duration?: number;
  createdAt: string;
}

// Authenticated user on the platform — extended profile (onboarding fields).
// Match player1Id/player2Id/winnerId all reference Profile.id directly.
export interface Profile {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  avatarColor?: string;

  birthDate?: string;
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

// ----- Social feed -----
export type ReactionEmoji = 'fire' | 'cry' | 'goat';

export const REACTION_EMOJIS: Record<ReactionEmoji, string> = {
  fire: '🔥',
  cry: '😭',
  goat: '🐐',
};

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  mentions: string[];
  createdAt: string;
}

// Posts são criados via trigger no DB ao confirmar match.
// reactions/comments são hidratados no client via store.
export interface Post {
  id: string;
  matchId: string;
  authorId: string;
  caption?: string;
  bannerUrl?: string;
  createdAt: string;
  reactions: PostReaction[];
  comments: PostComment[];
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
