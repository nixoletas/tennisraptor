import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Font, SurfaceColors } from '../constants/theme';
import { Match, Player } from '../constants/types';

interface Props {
  match: Match;
  players: Player[];
  myPlayerId?: string | null;
}

export function MatchCard({ match, players, myPlayerId }: Props) {
  const p1 = players.find(p => p.id === match.player1Id);
  const p2 = players.find(p => p.id === match.player2Id);
  const won = match.winnerId === myPlayerId;
  const myInMatch = match.player1Id === myPlayerId || match.player2Id === myPlayerId;
  const surfaceColor = SurfaceColors[match.surface] ?? Colors.textSecondary;

  const scoreStr = match.sets
    .map(s => (s.tiebreak ? `${s.p1}(${s.tiebreak.p1})-${s.p2}(${s.tiebreak.p2})` : `${s.p1}-${s.p2}`))
    .join('  ');

  const dateStr = new Date(match.date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/match/${match.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View style={[styles.surfaceDot, { backgroundColor: surfaceColor }]} />
        <Text style={styles.surface}>{match.surface.toUpperCase()}</Text>
        <Text style={styles.date}>{dateStr}</Text>
        {myInMatch && (
          <View style={[styles.badge, { backgroundColor: won ? Colors.green + '30' : Colors.red + '30' }]}>
            <Text style={[styles.badgeText, { color: won ? Colors.green : Colors.red }]}>
              {won ? 'W' : 'L'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.matchup}>
        <View style={styles.playerRow}>
          <View style={[styles.avatar, { backgroundColor: p1?.avatarColor ?? Colors.textTertiary }]}>
            <Text style={styles.avatarText}>{p1?.name?.[0] ?? '?'}</Text>
          </View>
          <Text style={[styles.playerName, match.winnerId === match.player1Id && styles.winner]} numberOfLines={1}>
            {p1?.name ?? 'Desconhecido'}
          </Text>
        </View>

        <Text style={styles.score}>{scoreStr}</Text>

        <View style={styles.playerRow}>
          <View style={[styles.avatar, { backgroundColor: p2?.avatarColor ?? Colors.textTertiary }]}>
            <Text style={styles.avatarText}>{p2?.name?.[0] ?? '?'}</Text>
          </View>
          <Text style={[styles.playerName, match.winnerId === match.player2Id && styles.winner]} numberOfLines={1}>
            {p2?.name ?? 'Desconhecido'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  surfaceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  surface: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  date: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: Font.xs,
    fontWeight: '800',
  },
  matchup: {
    gap: 6,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Font.sm,
    fontWeight: '700',
    color: Colors.bg,
  },
  playerName: {
    fontSize: Font.md,
    color: Colors.textSecondary,
    flex: 1,
  },
  winner: {
    color: Colors.text,
    fontWeight: '700',
  },
  score: {
    fontSize: Font.md,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginLeft: 36,
    letterSpacing: 1,
  },
});
