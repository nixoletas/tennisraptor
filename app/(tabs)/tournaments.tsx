import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font, SurfaceColors } from '../../constants/theme';
import { useTournamentStore } from '../../stores/useTournamentStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useMatchStore } from '../../stores/useMatchStore';
import { TournamentStatus } from '../../constants/types';

const STATUS_LABELS: Record<TournamentStatus, string> = {
  upcoming: 'Em Breve', active: 'Ativo', completed: 'Finalizado',
};

const STATUS_COLORS: Record<TournamentStatus, string> = {
  upcoming: Colors.orange, active: Colors.green, completed: Colors.textTertiary,
};

const FORMAT_LABELS: Record<string, string> = {
  round_robin: 'Round Robin', single_elim: 'Eliminação Simples', groups: 'Grupos',
};

export default function TournamentsScreen() {
  const { tournaments, groups } = useTournamentStore();
  const { players } = usePlayerStore();
  const { matches } = useMatchStore();
  const [tab, setTab] = useState<'tournaments' | 'groups'>('tournaments');

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'tournaments' && styles.tabActive]}
          onPress={() => setTab('tournaments')}
        >
          <Text style={[styles.tabText, tab === 'tournaments' && styles.tabTextActive]}>Torneios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'groups' && styles.tabActive]}
          onPress={() => setTab('groups')}
        >
          <Text style={[styles.tabText, tab === 'groups' && styles.tabTextActive]}>Grupos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {tab === 'tournaments' && (
          <>
            {tournaments.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyTitle}>Nenhum torneio</Text>
                <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/tournament/new')}>
                  <Text style={styles.newBtnText}>CRIAR TORNEIO</Text>
                </TouchableOpacity>
              </View>
            ) : (
              tournaments.map(t => {
                const statusColor = STATUS_COLORS[t.status];
                const surfaceColor = SurfaceColors[t.surface] ?? Colors.textSecondary;
                const playerCount = t.playerIds.length;
                const matchCount = matches.filter(m => m.tournamentId === t.id).length;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.card}
                    onPress={() => router.push(`/tournament/${t.id}`)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.surfaceDot, { backgroundColor: surfaceColor }]} />
                      <Text style={styles.formatLabel}>{FORMAT_LABELS[t.format]}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {STATUS_LABELS[t.status]}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tName}>{t.name}</Text>
                    <View style={styles.cardMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{playerCount} jogadores</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="tennisball-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{matchCount} partidas</Text>
                      </View>
                      <Text style={styles.metaDate}>
                        {new Date(t.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {tab === 'groups' && (
          <>
            {groups.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>Nenhum grupo</Text>
                <Text style={styles.emptyText}>Crie um grupo para acompanhar rankings entre amigos.</Text>
              </View>
            ) : (
              groups.map(g => {
                const memberCount = g.memberIds.length;
                const groupMatches = matches.filter(m => m.groupId === g.id).length;
                return (
                  <View key={g.id} style={styles.card}>
                    <Text style={styles.tName}>{g.name}</Text>
                    <View style={styles.cardMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{memberCount} membros</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="tennisball-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{groupMatches} partidas</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/tournament/new')}>
        <Ionicons name="add" size={28} color={Colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { fontSize: Font.sm, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.accent },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  surfaceDot: { width: 8, height: 8, borderRadius: 4 },
  formatLabel: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600', flex: 1, letterSpacing: 0.3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  statusText: { fontSize: Font.xs, fontWeight: '800' },
  tName: { fontSize: Font.lg, fontWeight: '800', color: Colors.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Font.xs, color: Colors.textSecondary },
  metaDate: { fontSize: Font.xs, color: Colors.textTertiary, marginLeft: 'auto' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: Font.lg, fontWeight: '700', color: Colors.textSecondary },
  emptyText: { fontSize: Font.sm, color: Colors.textTertiary, textAlign: 'center' },
  newBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  newBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.sm, letterSpacing: 1 },
  fab: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    elevation: 8,
  },
});
