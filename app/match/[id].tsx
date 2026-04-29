import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font, SurfaceColors, SURFACE_LABELS } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { Profile } from '../../constants/types';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches, deleteMatch } = useMatchStore();
  const me = useProfileStore(s => s.me);
  const nearby = useProfileStore(s => s.nearby);

  const profilesMap = useMemo(() => {
    const m = new Map<string, Profile>();
    if (me) m.set(me.id, me);
    for (const p of nearby) m.set(p.id, p);
    return m;
  }, [me, nearby]);

  const match = matches.find(m => m.id === id);
  if (!match) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Partida não encontrada</Text>
      </View>
    );
  }

  const p1 = profilesMap.get(match.player1Id);
  const p2 = profilesMap.get(match.player2Id);
  const surfaceColor = SurfaceColors[match.surface] ?? Colors.textSecondary;

  const handleDelete = () => {
    Alert.alert('Excluir Partida', 'Tem certeza? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: () => { deleteMatch(id); router.back(); },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={Colors.red} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.surfaceTag, { backgroundColor: surfaceColor + '20' }]}>
            <View style={[styles.surfaceDot, { backgroundColor: surfaceColor }]} />
            <Text style={[styles.surfaceText, { color: surfaceColor }]}>
              {SURFACE_LABELS[match.surface]}
            </Text>
          </View>
          <Text style={styles.date}>
            {new Date(match.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          {match.duration && (
            <Text style={styles.duration}>{match.duration} min</Text>
          )}
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.playerRow}>
            {p1?.avatarUrl ? (
              <Image source={{ uri: p1.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: p1?.avatarColor ?? Colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.avatarText}>{p1?.name?.[0] ?? '?'}</Text>
              </View>
            )}
            <Text style={[styles.playerName, match.winnerId === match.player1Id && styles.playerNameWinner]}>
              {p1?.name ?? 'Jogador 1'}
            </Text>
            {match.winnerId === match.player1Id && (
              <Ionicons name="trophy" size={16} color={Colors.accent} />
            )}
            <View style={styles.setScores}>
              {match.sets.map((s, i) => (
                <Text key={i} style={[styles.setScore, s.p1 > s.p2 && styles.setScoreWin]}>
                  {s.p1}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.setLabels}>
            <View style={{ width: 44 + Spacing.md + 80, flex: 1 }} />
            {match.sets.map((_, i) => (
              <Text key={i} style={styles.setLabel}>S{i + 1}</Text>
            ))}
          </View>

          <View style={styles.playerRow}>
            {p2?.avatarUrl ? (
              <Image source={{ uri: p2.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: p2?.avatarColor ?? Colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.avatarText}>{p2?.name?.[0] ?? '?'}</Text>
              </View>
            )}
            <Text style={[styles.playerName, match.winnerId === match.player2Id && styles.playerNameWinner]}>
              {p2?.name ?? 'Jogador 2'}
            </Text>
            {match.winnerId === match.player2Id && (
              <Ionicons name="trophy" size={16} color={Colors.accent} />
            )}
            <View style={styles.setScores}>
              {match.sets.map((s, i) => (
                <Text key={i} style={[styles.setScore, s.p2 > s.p1 && styles.setScoreWin]}>
                  {s.p2}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Tiebreak details */}
        {match.sets.some(s => s.tiebreak) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiebreaks</Text>
            {match.sets.map((s, i) => s.tiebreak && (
              <View key={i} style={styles.tiebreakRow}>
                <Text style={styles.tiebreakLabel}>SET {i + 1}</Text>
                <Text style={styles.tiebreakScore}>
                  {s.tiebreak.p1} — {s.tiebreak.p2}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* H2H link */}
        {p1 && p2 && (
          <TouchableOpacity
            style={styles.h2hBtn}
            onPress={() => router.push(`/player/${p1.id}?vs=${p2.id}`)}
          >
            <Ionicons name="stats-chart" size={16} color={Colors.accent} />
            <Text style={styles.h2hText}>Ver H2H: {p1.name} vs {p2.name}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Notes */}
        {match.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.notes}>{match.notes}</Text>
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
  notFoundText: { color: Colors.textSecondary, fontSize: Font.md },
  header: { gap: 4 },
  surfaceTag: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, alignSelf: 'flex-start',
  },
  surfaceDot: { width: 8, height: 8, borderRadius: 4 },
  surfaceText: { fontSize: Font.sm, fontWeight: '700' },
  date: { fontSize: Font.md, color: Colors.text, fontWeight: '600', textTransform: 'capitalize' },
  duration: { fontSize: Font.sm, color: Colors.textTertiary },
  scoreCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm,
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Font.lg, fontWeight: '800', color: Colors.bg },
  playerName: { flex: 1, fontSize: Font.md, color: Colors.textSecondary, fontWeight: '600' },
  playerNameWinner: { color: Colors.text, fontWeight: '800' },
  setScores: { flexDirection: 'row', gap: Spacing.sm },
  setScore: { fontSize: Font.xl, fontWeight: '800', color: Colors.textSecondary, minWidth: 24, textAlign: 'center' },
  setScoreWin: { color: Colors.accent },
  setLabels: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginLeft: 44 + Spacing.sm },
  setLabel: { fontSize: Font.xs, color: Colors.textTertiary, minWidth: 24, textAlign: 'center', fontWeight: '600' },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  tiebreakRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
  },
  tiebreakLabel: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '700' },
  tiebreakScore: { fontSize: Font.sm, color: Colors.text, fontWeight: '700' },
  h2hBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
  },
  h2hText: { flex: 1, fontSize: Font.sm, color: Colors.accent, fontWeight: '600' },
  notes: {
    fontSize: Font.md, color: Colors.textSecondary, lineHeight: 22,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
  },
});
