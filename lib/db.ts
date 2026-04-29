import * as Crypto from 'expo-crypto';
import { Match, Player, Tournament, Group, MatchSet, Surface, MatchFormat, TournamentFormat, TournamentStatus } from '../constants/types';

export function newId(): string {
  return Crypto.randomUUID();
}

// ---- DB row shapes (snake_case) ----
export type PlayerRow = {
  id: string;
  owner_id: string;
  name: string;
  handle: string | null;
  avatar_color: string;
  is_me: boolean;
  created_at: string;
};

export type MatchRow = {
  id: string;
  owner_id: string;
  date: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  sets: MatchSet[];
  surface: Surface;
  format: MatchFormat;
  tournament_id: string | null;
  group_id: string | null;
  notes: string | null;
  duration_minutes: number | null;
  created_at: string;
};

export type TournamentRow = {
  id: string;
  owner_id: string;
  name: string;
  format: TournamentFormat;
  surface: Surface;
  start_date: string;
  end_date: string | null;
  status: TournamentStatus;
  created_at: string;
};

export type GroupRow = {
  id: string;
  owner_id: string;
  name: string;
  admin_id: string | null;
  created_at: string;
};

// ---- Mappers (row → app type) ----
export function playerFromRow(r: PlayerRow): Player {
  return {
    id: r.id,
    name: r.name,
    handle: r.handle ?? undefined,
    avatarColor: r.avatar_color,
    isMe: r.is_me,
    createdAt: r.created_at,
  };
}

export function matchFromRow(r: MatchRow): Match {
  return {
    id: r.id,
    date: r.date,
    player1Id: r.player1_id,
    player2Id: r.player2_id,
    winnerId: r.winner_id,
    sets: r.sets ?? [],
    surface: r.surface,
    format: r.format,
    tournamentId: r.tournament_id ?? undefined,
    groupId: r.group_id ?? undefined,
    notes: r.notes ?? undefined,
    duration: r.duration_minutes ?? undefined,
    createdAt: r.created_at,
  };
}

export function tournamentFromRow(r: TournamentRow, playerIds: string[]): Tournament {
  return {
    id: r.id,
    name: r.name,
    format: r.format,
    surface: r.surface,
    startDate: r.start_date,
    endDate: r.end_date ?? undefined,
    playerIds,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function groupFromRow(r: GroupRow, memberIds: string[]): Group {
  return {
    id: r.id,
    name: r.name,
    adminId: r.admin_id,
    memberIds,
    createdAt: r.created_at,
  };
}
