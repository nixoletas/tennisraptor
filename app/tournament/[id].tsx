import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font, SurfaceColors } from '../../constants/theme';
import { useTournamentStore } from '../../stores/useTournamentStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useMatchStore } from '../../stores/useMatchStore';
import { MatchCard } from '../../components/MatchCard';

const STATUS_LABELS = { upcoming: 'Em Breve', active: 'Ativo', completed: 'Finalizado' };
const STATUS_COLORS = { upcoming: Colors.orange, active: Colors.green, completed: Colors.textTertiary };
const FORMAT_LABELS: Record<string, string> = {
  round_robin: 'Round Robin', single_elim: 'Eliminação Simples', groups: 'Grupos',
};

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tournaments, getStandings, deleteTournament, setStatus } = useTournamentStore();
  const { players } = usePlayerStore();
  const { matches } = useMatchStore();
  const [tab, setTab] = useState<'standings' | 'matches'>('standings');

  const tournament = tournaments.find(t => t.id === id);
  if (!tournament) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Torneio não encontrado</Text>
      </View>
    );
  }

  const standings = getStandings(id, matches);
  const tournamentMatches = matches.filter(m => m.tournamentId === id && !m.isLive);
  const surfaceColor = SurfaceColors[tournament.surface] ?? Colors.textSecondary;
  const statusColor = STATUS_COLORS[tournament.status];

  const handleDelete = () => {
    Alert.alert('Excluir Torneio', `Excluir "${tournament.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: () => { deleteTournament(id); router.back(); },
      },
    ]);
  };

  const cycleStatus = () => {
    const next = tournament.status === 'upcoming' ? 'active'
      : tournament.status === 'active' ? 'completed' : 'upcoming';
    setStatus(id, next);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: tournament.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={Colors.red} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.metaRow}>
            <View style={[styles.surfaceTag, { backgroundColor: surfaceColor + '20' }]}>
              <View style={[styles.surfaceDot, { backgroundColor: surfaceColor }]} />
              <Text style={[styles.surfaceText, { color: surfaceColor }]}>{tournament.surface}</Text>
            </View>
            <Text style={styles.formatText}>{FORMAT_LABELS[tournament.format]}</Text>
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}
              onPress={cycleStatus}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[tournament.status]}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.date}>
            {new Date(tournament.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{tournament.playerIds.length}</Text>
            <Text style={styles.statLabel}>Jogadores</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{tournamentMatches.length}</Text>
            <Text style={styles.statLabel}>Partidas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {tournament.playerIds.length > 1
                ? Math.round(tournament.playerIds.length * (tournament.playerIds.length - 1) / 2)
                : 0}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'standings' && styles.tabActive]}
            onPress={() => setTab('standings')}
          >
            <Text style={[styles.tabText, tab === 'standings' && styles.tabTextActive]}>Classificação</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'matches' && styles.tabActive]}
            onPress={() => setTab('matches')}
          >
            <Text style={[styles.tabText, tab === 'matches' && styles.tabTextActive]}>Partidas</Text>
          </TouchableOpacity>
        </View>

        {/* Standings */}
        {tab === 'standings' && (
          <View style={styles.section}>
            {standings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhuma partida registrada ainda</Text>
              </View>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.posCol]}>#</Text>
                  <Text style={[styles.th, styles.nameCol]}>Jogador</Text>
                  <Text style={styles.th}>V</Text>
                  <Text style={styles.th}>D</Text>
                  <Text style={styles.th}>Pts</Text>
                  <Text style={styles.th}>SV</Text>
                  <Text style={styles.th}>SD</Text>
                </View>
                {standings.map((s, i) => {
                  const p = players.find(p => p.id === s.playerId);
                  return (
                    <TouchableOpacity
                      key={s.playerId}
                      style={[styles.tableRow, i === 0 && styles.tableRowFirst]}
                      onPress={() => router.push(`/player/${s.playerId}`)}
                    >
                      <Text style={[styles.td, styles.posCol, i === 0 && styles.tdFirst]}>{i + 1}</Text>
                      <View style={styles.nameCol}>
                        <View style={[styles.rowAvatar, { backgroundColor: p?.avatarColor ?? Colors.card }]}>
                          <Text style={styles.rowAvatarText}>{p?.name?.[0]}</Text>
                        </View>
                        <Text style={[styles.td, i === 0 && styles.tdFirst]} numberOfLines={1}>
                          {p?.name ?? '?'}
                        </Text>
                      </View>
                      <Text style={[styles.td, { color: Colors.green }]}>{s.wins}</Text>
                      <Text style={[styles.td, { color: Colors.red }]}>{s.losses}</Text>
                      <Text style={[styles.td, styles.tdBold, i === 0 && styles.tdFirst]}>{s.points}</Text>
                      <Text style={styles.td}>{s.setsWon}</Text>
                      <Text style={styles.td}>{s.setsLost}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Matches */}
        {tab === 'matches' && (
          <View style={styles.section}>
            {tournamentMatches.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhuma partida registrada</Text>
                <TouchableOpacity
                  style={styles.logMatchBtn}
                  onPress={() => router.push('/match/new')}
                >
                  <Text style={styles.logMatchText}>REGISTRAR PARTIDA</Text>
                </TouchableOpacity>
              </View>
            ) : (
              tournamentMatches.map(m => (
                <MatchCard key={m.id} match={m} players={players} />
              ))
            )}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.md, padding: Spacing.md },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: Colors.textSecondary },
  header: { gap: Spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  surfaceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  surfaceDot: { width: 7, height: 7, borderRadius: 3.5 },
  surfaceText: { fontSize: Font.xs, fontWeight: '700' },
  formatText: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: Font.xs, fontWeight: '800' },
  date: { fontSize: Font.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statBox: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: 2,
  },
  statValue: { fontSize: Font.xxl, fontWeight: '900', color: Colors.accent },
  statLabel: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { fontSize: Font.sm, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.accent },
  section: { gap: Spacing.sm },
  table: { backgroundColor: Colors.card, borderRadius: Radius.md, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border + '60',
  },
  tableRowFirst: { backgroundColor: Colors.accent + '10' },
  posCol: { width: 24, textAlign: 'center' },
  nameCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowAvatarText: { fontSize: 10, fontWeight: '800', color: Colors.bg },
  th: { width: 32, fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary, textAlign: 'center', textTransform: 'uppercase' },
  td: { width: 32, fontSize: Font.sm, color: Colors.textSecondary, textAlign: 'center' },
  tdFirst: { color: Colors.text },
  tdBold: { fontWeight: '800' },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  emptyText: { fontSize: Font.sm, color: Colors.textTertiary },
  logMatchBtn: { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  logMatchText: { color: Colors.bg, fontWeight: '800', fontSize: Font.sm, letterSpacing: 1 },
});
