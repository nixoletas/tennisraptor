import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { MatchCard } from '../../components/MatchCard';
import { Surface } from '../../constants/types';

const SURFACES: (Surface | 'all')[] = ['all', 'clay', 'hard', 'grass', 'carpet', 'indoor'];
const SURFACE_LABELS: Record<string, string> = {
  all: 'Todas', clay: 'Saibro', hard: 'Duro', grass: 'Grama', carpet: 'Carpete', indoor: 'Indoor',
};

export default function HistoryScreen() {
  const { matches, liveMatch } = useMatchStore();
  const { players, myPlayerId } = usePlayerStore();
  const [surface, setSurface] = useState<Surface | 'all'>('all');
  const [showMine, setShowMine] = useState(false);

  const filtered = matches
    .filter(m => !m.isLive)
    .filter(m => surface === 'all' || m.surface === surface)
    .filter(m => !showMine || m.player1Id === myPlayerId || m.player2Id === myPlayerId);

  return (
    <View style={styles.container}>
      {/* Live Banner */}
      {liveMatch && (
        <TouchableOpacity style={styles.liveBanner} onPress={() => router.push('/match/live')}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>PARTIDA EM ANDAMENTO — TOQUE PARA VER</Text>
        </TouchableOpacity>
      )}

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {SURFACES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, surface === s && styles.chipActive]}
            onPress={() => setSurface(s)}
          >
            <Text style={[styles.chipText, surface === s && styles.chipTextActive]}>
              {SURFACE_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
        {myPlayerId && (
          <TouchableOpacity
            style={[styles.chip, showMine && styles.chipActive]}
            onPress={() => setShowMine(v => !v)}
          >
            <Ionicons name="person" size={12} color={showMine ? Colors.bg : Colors.textSecondary} />
            <Text style={[styles.chipText, showMine && styles.chipTextActive]}>Minhas</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎾</Text>
            <Text style={styles.emptyTitle}>Nenhuma partida</Text>
            <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/match/new')}>
              <Text style={styles.newBtnText}>REGISTRAR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.count}>{filtered.length} partida{filtered.length !== 1 ? 's' : ''}</Text>
            {filtered.map(m => (
              <MatchCard key={m.id} match={m} players={players} myPlayerId={myPlayerId} />
            ))}
          </>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/match/new')}>
        <Ionicons name="add" size={28} color={Colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  liveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.red + '20', padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.red + '30',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red },
  liveText: { color: Colors.red, fontWeight: '800', fontSize: Font.xs, letterSpacing: 1, flex: 1 },
  filters: {
    flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: Font.xs, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: Colors.bg },
  list: { padding: Spacing.md, gap: Spacing.sm },
  count: { fontSize: Font.xs, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: Font.lg, fontWeight: '700', color: Colors.textSecondary },
  newBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  newBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.sm, letterSpacing: 1 },
  fab: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    elevation: 8,
  },
});
