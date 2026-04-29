import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { MatchCard } from '../../components/MatchCard';
import { StatCard } from '../../components/StatCard';
import { Profile } from '../../constants/types';

export default function HomeScreen() {
  const { matches, liveMatch, getPlayerStats } = useMatchStore();
  const me = useProfileStore(s => s.me);
  const nearby = useProfileStore(s => s.nearby);

  const myId = me?.id ?? null;
  const profilesMap = useMemo(() => {
    const m = new Map<string, Profile>();
    if (me) m.set(me.id, me);
    for (const p of nearby) m.set(p.id, p);
    return m;
  }, [me, nearby]);

  const stats = myId ? getPlayerStats(myId) : null;
  const pendingCount = useMemo(() => (
    myId ? matches.filter(m => m.player2Id === myId && m.status === 'pending').length : 0
  ), [matches, myId]);
  // Mostra só matches confirmadas no feed; pending/rejected vão pra /pending.
  const recent = matches.filter(m => m.status === 'confirmed').slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#1A2400', '#0D0D0D']} style={styles.hero}>
        <View>
          <Text style={styles.greeting}>Bom jogo,</Text>
          <Text style={styles.heroName}>{me?.name ?? 'Jogador'}</Text>
        </View>
        {stats && (
          <View style={styles.heroStats}>
            <Text style={styles.heroWin}>{stats.wins}V</Text>
            <Text style={styles.heroSep}>/</Text>
            <Text style={styles.heroLoss}>{stats.losses}D</Text>
          </View>
        )}
      </LinearGradient>

      {liveMatch && (
        <TouchableOpacity
          style={styles.liveBanner}
          onPress={() => router.push('/match/live')}
        >
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>PARTIDA AO VIVO</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.red} />
        </TouchableOpacity>
      )}

      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => router.push('/pending' as any)}
        >
          <Ionicons name="alert-circle" size={20} color={Colors.orange} />
          <Text style={styles.pendingText}>
            {pendingCount} {pendingCount === 1 ? 'partida pra aprovar' : 'partidas pra aprovar'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.orange} />
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ação Rápida</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={() => router.push('/match/live')}>
            <Ionicons name="radio-button-on" size={24} color={Colors.bg} />
            <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>Jogar Agora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/match/new')}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.text} />
            <Text style={styles.actionLabel}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/players')}>
            <Ionicons name="people-outline" size={24} color={Colors.text} />
            <Text style={styles.actionLabel}>Adversários</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/history' as any)}>
            <Ionicons name="time-outline" size={24} color={Colors.text} />
            <Text style={styles.actionLabel}>Histórico</Text>
          </TouchableOpacity>
        </View>
      </View>

      {stats && (stats.wins + stats.losses) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meu Desempenho</Text>
          <View style={styles.statsRow}>
            <StatCard label="Win Rate" value={`${Math.round(stats.winRate * 100)}%`} accent flex={1} />
            <StatCard label="Sets W/L" value={`${stats.setsWon}/${stats.setsLost}`} flex={1} />
            <StatCard label="Games W/L" value={`${stats.gamesWon}/${stats.gamesLost}`} flex={1} />
          </View>
        </View>
      )}

      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimas Partidas</Text>
            <TouchableOpacity onPress={() => router.push('/history' as any)}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.matchList}>
            {recent.map(m => (
              <MatchCard key={m.id} match={m} profiles={profilesMap} myId={myId} />
            ))}
          </View>
        </View>
      )}

      {matches.length === 0 && !liveMatch && (
        <View style={styles.empty}>
          <Ionicons name="tennisball-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Nenhuma partida ainda</Text>
          <Text style={styles.emptyText}>Registre sua primeira partida ou inicie um jogo ao vivo.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/match/new')}>
            <Text style={styles.emptyBtnText}>REGISTRAR PARTIDA</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.md },
  hero: {
    padding: Spacing.lg, paddingTop: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl,
  },
  greeting: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '500' },
  heroName: { fontSize: Font.xxl, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  heroStats: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroWin: { fontSize: Font.xl, fontWeight: '800', color: Colors.accent },
  heroSep: { fontSize: Font.md, color: Colors.textTertiary },
  heroLoss: { fontSize: Font.xl, fontWeight: '800', color: Colors.textSecondary },
  liveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.red + '20', borderRadius: Radius.md,
    marginHorizontal: Spacing.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.red + '40',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red },
  liveText: { flex: 1, color: Colors.red, fontWeight: '800', fontSize: Font.sm, letterSpacing: 1 },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.orange + '20', borderRadius: Radius.md,
    marginHorizontal: Spacing.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.orange + '40',
  },
  pendingText: { flex: 1, color: Colors.orange, fontWeight: '800', fontSize: Font.sm, letterSpacing: 0.5 },
  section: { gap: Spacing.sm, paddingHorizontal: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Font.sm, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  seeAll: { fontSize: Font.sm, color: Colors.accent, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
  },
  actionPrimary: { backgroundColor: Colors.accent },
  actionLabel: { fontSize: Font.xs, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  actionLabelPrimary: { color: Colors.bg },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  matchList: { gap: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  emptyText: { fontSize: Font.md, color: Colors.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  emptyBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.sm, letterSpacing: 1 },
});
