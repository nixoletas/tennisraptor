import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font, SurfaceColors, SURFACE_LABELS } from '../constants/theme';
import { useMatchStore } from '../stores/useMatchStore';
import { useProfileStore } from '../stores/useProfileStore';
import { Profile, Match } from '../constants/types';

export default function PendingScreen() {
  const { matches, approveMatch, rejectMatch } = useMatchStore();
  const me = useProfileStore(s => s.me);
  const nearby = useProfileStore(s => s.nearby);

  const profilesMap = useMemo(() => {
    const m = new Map<string, Profile>();
    if (me) m.set(me.id, me);
    for (const p of nearby) m.set(p.id, p);
    return m;
  }, [me, nearby]);

  const pending = useMemo(() => (
    me ? matches.filter(m => m.player2Id === me.id && m.status === 'pending') : []
  ), [matches, me]);

  const handleApprove = (id: string) => {
    Alert.alert('Aprovar partida', 'Confirma o resultado dessa partida?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprovar', onPress: () => approveMatch(id) },
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Rejeitar partida', 'O resultado está errado? Será marcada como rejeitada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rejeitar', style: 'destructive', onPress: () => rejectMatch(id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Partidas pra você aprovar</Text>
        <Text style={styles.subtitle}>
          Adversários registraram esses jogos. Confirma o resultado pra contar nas estatísticas.
        </Text>
      </View>

      {pending.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-done-circle-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Nada pendente</Text>
          <Text style={styles.emptyText}>Todas as partidas estão confirmadas.</Text>
        </View>
      ) : (
        pending.map(m => (
          <PendingCard
            key={m.id}
            match={m}
            opponent={profilesMap.get(m.player1Id)}
            myId={me?.id}
            onApprove={() => handleApprove(m.id)}
            onReject={() => handleReject(m.id)}
          />
        ))
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function PendingCard({
  match, opponent, myId, onApprove, onReject,
}: {
  match: Match;
  opponent?: Profile;
  myId?: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const surfaceColor = SurfaceColors[match.surface] ?? Colors.textSecondary;
  const won = match.winnerId === myId;

  const scoreStr = match.sets
    .map(s => (s.tiebreak ? `${s.p2}(${s.tiebreak.p2})-${s.p1}(${s.tiebreak.p1})` : `${s.p2}-${s.p1}`))
    .join('  ');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.surfaceTag, { backgroundColor: surfaceColor + '25' }]}>
          <View style={[styles.surfaceDot, { backgroundColor: surfaceColor }]} />
          <Text style={[styles.surfaceText, { color: surfaceColor }]}>{SURFACE_LABELS[match.surface]}</Text>
        </View>
        <Text style={styles.date}>
          {new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </Text>
      </View>

      <View style={styles.opponentRow}>
        {opponent?.avatarUrl ? (
          <Image source={{ uri: opponent.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: opponent?.avatarColor ?? Colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.avatarText}>{opponent?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.opponentLabel}>Registrado por</Text>
          <Text style={styles.opponentName}>{opponent?.name ?? 'Desconhecido'}</Text>
        </View>
        <View style={[styles.resultBadge, { backgroundColor: (won ? Colors.green : Colors.red) + '25' }]}>
          <Text style={[styles.resultText, { color: won ? Colors.green : Colors.red }]}>
            {won ? 'VOCÊ VENCEU' : 'VOCÊ PERDEU'}
          </Text>
        </View>
      </View>

      <Text style={styles.score}>{scoreStr}</Text>

      {match.location && (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{match.location}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
          <Ionicons name="close" size={18} color={Colors.red} />
          <Text style={styles.rejectText}>REJEITAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
          <Ionicons name="checkmark" size={18} color={Colors.bg} />
          <Text style={styles.approveText}>APROVAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.md, gap: Spacing.md },
  header: { gap: 4, paddingHorizontal: Spacing.xs },
  title: { fontSize: Font.xl, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: Font.sm, color: Colors.textSecondary, lineHeight: 20 },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: Font.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: Font.sm, color: Colors.textSecondary, textAlign: 'center' },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.orange + '40',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  surfaceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
  },
  surfaceDot: { width: 6, height: 6, borderRadius: 3 },
  surfaceText: { fontSize: Font.xs, fontWeight: '700' },
  date: { fontSize: Font.xs, color: Colors.textSecondary, marginLeft: 'auto', fontWeight: '600' },

  opponentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: Font.lg, fontWeight: '900', color: Colors.bg },
  opponentLabel: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },
  opponentName: { fontSize: Font.md, fontWeight: '800', color: Colors.text },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  resultText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  score: { fontSize: Font.xl, fontWeight: '900', color: Colors.text, letterSpacing: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: Font.xs, color: Colors.textSecondary },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.red + '20', borderRadius: Radius.md,
    paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.red + '40',
  },
  rejectText: { fontSize: Font.sm, fontWeight: '900', color: Colors.red, letterSpacing: 1 },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  approveText: { fontSize: Font.sm, fontWeight: '900', color: Colors.bg, letterSpacing: 1 },
});
