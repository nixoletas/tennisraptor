import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useMatchStore } from '../../stores/useMatchStore';
import { MatchCard } from '../../components/MatchCard';
import { H2HBar } from '../../components/H2HBar';
import { StatCard } from '../../components/StatCard';

export default function PlayerDetailScreen() {
  const { id, vs } = useLocalSearchParams<{ id: string; vs?: string }>();
  const { players, getH2H, removePlayer } = usePlayerStore();
  const { matches, getPlayerStats } = useMatchStore();

  const player = players.find(p => p.id === id);
  const vsPlayer = vs ? players.find(p => p.id === vs) : null;
  const opponents = players.filter(p => p.id !== id);

  const [selectedVs, setSelectedVs] = useState<string | null>(vs ?? null);
  const vsP = selectedVs ? players.find(p => p.id === selectedVs) : null;

  if (!player) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Jogador não encontrado</Text>
      </View>
    );
  }

  const stats = getPlayerStats(player.id);
  const h2h = selectedVs ? getH2H(player.id, selectedVs, matches) : null;

  const handleDelete = () => {
    Alert.alert('Remover Jogador', `Remover ${player.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => { removePlayer(id); router.back(); },
      },
    ]);
  };

  const playerMatches = matches
    .filter(m => !m.isLive && (m.player1Id === player.id || m.player2Id === player.id))
    .slice(0, 20);

  const h2hMatches = h2h?.matches ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          title: player.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={Colors.red} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player Header */}
        <View style={styles.playerHeader}>
          <View style={[styles.avatar, { backgroundColor: player.avatarColor }]}>
            <Text style={styles.avatarText}>{player.name[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            {player.handle && <Text style={styles.playerHandle}>@{player.handle}</Text>}
            <Text style={styles.playerSince}>
              desde {new Date(player.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geral</Text>
          <View style={styles.statsRow}>
            <StatCard label="Vitórias" value={stats.wins} accent flex={1} />
            <StatCard label="Derrotas" value={stats.losses} flex={1} />
            <StatCard label="Win Rate" value={`${Math.round(stats.winRate * 100)}%`} flex={1} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Sets V/D" value={`${stats.setsWon}/${stats.setsLost}`} flex={1} />
            <StatCard label="Games V/D" value={`${stats.gamesWon}/${stats.gamesLost}`} flex={1} />
          </View>
        </View>

        {/* H2H Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>H2H — Confronto Direto</Text>

          {/* Opponent Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.opponentRow}>
            {opponents.map(op => (
              <TouchableOpacity
                key={op.id}
                style={[styles.opponentChip, selectedVs === op.id && styles.opponentChipActive]}
                onPress={() => setSelectedVs(selectedVs === op.id ? null : op.id)}
              >
                <View style={[styles.opChipAvatar, { backgroundColor: op.avatarColor }]}>
                  <Text style={styles.opChipAvatarText}>{op.name[0]}</Text>
                </View>
                <Text style={[styles.opChipName, selectedVs === op.id && styles.opChipNameActive]}>
                  {op.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {h2h && vsP ? (
            <View style={styles.h2hCard}>
              <View style={styles.h2hHeader}>
                <Text style={styles.h2hPlayerName}>{player.name}</Text>
                <Text style={styles.h2hVs}>VS</Text>
                <Text style={[styles.h2hPlayerName, styles.right]}>{vsP.name}</Text>
              </View>

              <H2HBar
                p1Name={player.name}
                p2Name={vsP.name}
                p1Value={h2h.p1Wins}
                p2Value={h2h.p2Wins}
                label="Vitórias"
              />
              <H2HBar
                p1Name={player.name}
                p2Name={vsP.name}
                p1Value={h2h.p1SetsWon}
                p2Value={h2h.p2SetsWon}
                label="Sets"
              />
              <H2HBar
                p1Name={player.name}
                p2Name={vsP.name}
                p1Value={h2h.p1GamesWon}
                p2Value={h2h.p2GamesWon}
                label="Games"
              />

              {h2h.lastMet && (
                <Text style={styles.lastMet}>
                  Último confronto: {new Date(h2h.lastMet).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
              )}

              {h2hMatches.length > 0 && (
                <View style={styles.h2hMatches}>
                  <Text style={styles.h2hMatchesTitle}>Confrontos</Text>
                  {h2hMatches.map(m => (
                    <MatchCard key={m.id} match={m} players={players} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.h2hEmpty}>
              <Text style={styles.h2hEmptyText}>Selecione um adversário para ver o H2H</Text>
            </View>
          )}
        </View>

        {/* Match History */}
        {!selectedVs && playerMatches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico</Text>
            {playerMatches.map(m => (
              <MatchCard key={m.id} match={m} players={players} />
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.lg, padding: Spacing.md },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: Colors.textSecondary, fontSize: Font.md },
  playerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Font.xxxl, fontWeight: '900', color: Colors.bg },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  playerHandle: { fontSize: Font.md, color: Colors.textSecondary },
  playerSince: { fontSize: Font.xs, color: Colors.textTertiary },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  opponentRow: { flexDirection: 'row', gap: Spacing.xs, paddingBottom: 4 },
  opponentChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 2, borderColor: 'transparent',
  },
  opponentChipActive: { borderColor: Colors.blue },
  opChipAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  opChipAvatarText: { fontSize: Font.xs, fontWeight: '800', color: Colors.bg },
  opChipName: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600' },
  opChipNameActive: { color: Colors.text },
  h2hCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.md,
  },
  h2hHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  h2hPlayerName: { flex: 1, fontSize: Font.sm, fontWeight: '800', color: Colors.text },
  h2hVs: { fontSize: Font.xs, fontWeight: '900', color: Colors.textTertiary },
  right: { textAlign: 'right' },
  lastMet: { fontSize: Font.xs, color: Colors.textTertiary, textAlign: 'center' },
  h2hMatches: { gap: Spacing.sm },
  h2hMatchesTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  h2hEmpty: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.xl, alignItems: 'center',
  },
  h2hEmptyText: { fontSize: Font.sm, color: Colors.textTertiary },
});
