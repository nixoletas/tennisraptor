import * as Crypto from 'expo-crypto';
import {
  Match, Profile, MatchSet, Surface, MatchFormat, MatchStatus,
  DominantHand, PlayStyle, Environment,
} from '../constants/types';

export function newId(): string {
  return Crypto.randomUUID();
}

// ---- DB row shapes (snake_case) ----
export type ProfileRow = {
  id: string;
  name: string;
  handle: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  dominant_hand: DominantHand | null;
  play_style: PlayStyle | null;
  preferred_environment: Environment | null;
  preferred_surface: Surface | null;
  similar_pro_id: string | null;
  region_state: string | null;
  region_city: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type MatchRow = {
  id: string;
  owner_id: string;
  date: string;
  scheduled_time: string | null;
  location: string | null;
  banner_url: string | null;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  sets: MatchSet[];
  surface: Surface;
  format: MatchFormat;
  status: MatchStatus;
  confirmed_at: string | null;
  rejected_at: string | null;
  notes: string | null;
  duration_minutes: number | null;
  created_at: string;
};

// ---- Mappers (row → app type) ----
export function profileFromRow(r: ProfileRow): Profile {
  return {
    id: r.id,
    name: r.name,
    handle: r.handle ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    avatarColor: r.avatar_color ?? undefined,
    birthDate: r.birth_date ?? undefined,
    weightKg: r.weight_kg ?? undefined,
    heightCm: r.height_cm ?? undefined,
    dominantHand: r.dominant_hand ?? undefined,
    playStyle: r.play_style ?? undefined,
    preferredEnvironment: r.preferred_environment ?? undefined,
    preferredSurface: r.preferred_surface ?? undefined,
    similarProId: r.similar_pro_id ?? undefined,
    regionState: r.region_state ?? undefined,
    regionCity: r.region_city ?? undefined,
    instagramUrl: r.instagram_url ?? undefined,
    linkedinUrl: r.linkedin_url ?? undefined,
    onboardingCompleted: r.onboarding_completed,
  };
}

export function matchFromRow(r: MatchRow): Match {
  return {
    id: r.id,
    date: r.date,
    scheduledTime: r.scheduled_time ?? undefined,
    location: r.location ?? undefined,
    bannerUrl: r.banner_url ?? undefined,
    player1Id: r.player1_id,
    player2Id: r.player2_id,
    winnerId: r.winner_id,
    sets: r.sets ?? [],
    surface: r.surface,
    format: r.format,
    status: r.status,
    confirmedAt: r.confirmed_at ?? undefined,
    rejectedAt: r.rejected_at ?? undefined,
    notes: r.notes ?? undefined,
    duration: r.duration_minutes ?? undefined,
    createdAt: r.created_at,
  };
}

// ---- Profile updates (camelCase patch → snake_case row) ----
export function profilePatchToRow(patch: Partial<Profile>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (patch.name !== undefined) r.name = patch.name;
  if (patch.handle !== undefined) r.handle = patch.handle ?? null;
  if (patch.avatarUrl !== undefined) r.avatar_url = patch.avatarUrl ?? null;
  if (patch.avatarColor !== undefined) r.avatar_color = patch.avatarColor ?? null;
  if (patch.birthDate !== undefined) r.birth_date = patch.birthDate ?? null;
  if (patch.weightKg !== undefined) r.weight_kg = patch.weightKg ?? null;
  if (patch.heightCm !== undefined) r.height_cm = patch.heightCm ?? null;
  if (patch.dominantHand !== undefined) r.dominant_hand = patch.dominantHand ?? null;
  if (patch.playStyle !== undefined) r.play_style = patch.playStyle ?? null;
  if (patch.preferredEnvironment !== undefined) r.preferred_environment = patch.preferredEnvironment ?? null;
  if (patch.preferredSurface !== undefined) r.preferred_surface = patch.preferredSurface ?? null;
  if (patch.similarProId !== undefined) r.similar_pro_id = patch.similarProId ?? null;
  if (patch.regionState !== undefined) r.region_state = patch.regionState ?? null;
  if (patch.regionCity !== undefined) r.region_city = patch.regionCity ?? null;
  if (patch.instagramUrl !== undefined) r.instagram_url = patch.instagramUrl ?? null;
  if (patch.linkedinUrl !== undefined) r.linkedin_url = patch.linkedinUrl ?? null;
  if (patch.onboardingCompleted !== undefined) r.onboarding_completed = patch.onboardingCompleted;
  return r;
}
