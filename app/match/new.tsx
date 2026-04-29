import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font, SurfaceColors } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { SetScoreInput } from '../../components/SetScoreInput';
import { Surface, MatchFormat, MatchSet } from '../../constants/types';

const SURFACES: Surface[] = ['clay', 'hard', 'grass', 'carpet', 'indoor'];
const SURFACE_LABELS: Record<Surface, string> = {
  clay: 'Saibro', hard: 'Duro', grass: 'Grama', carpet: 'Carpete', indoor: 'Indoor',
};

function determineWinner(sets: MatchSet[], p1Id: string, p2Id: string): string | null {
  if (sets.length === 0) return null;
  let p1Sets = 0, p2Sets = 0;
  for (const s of sets) {
    if (s.p1 > s.p2) p1Sets++;
    else if (s.p2 > s.p1) p2Sets++;
  }
  const needed = sets.length >= 4 ? 3 : 2;
  if (p1Sets >= needed) return p1Id;
  if (p2Sets >= needed) return p2Id;
  if (sets.length === 1 && (p1Sets === 1 || p2Sets === 1)) {
    return p1Sets === 1 ? p1Id : p2Id;
  }
  return null;
}

export default function NewMatchScreen() {
  const { logMatch } = useMatchStore();
  const { players, myPlayerId } = usePlayerStore();
  const [saving, setSaving] = useState(false);

  const [p1Id, setP1Id] = useState(myPlayerId ?? '');
  const [p2Id, setP2Id] = useState('');
  const [surface, setSurface] = useState<Surface>('hard');
  const [sets, setSets] = useState<MatchSet[]>([{ p1: 0, p2: 0 }]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const availableP2 = players.filter(p => p.id !== p1Id);
  const p1 = players.find(p => p.id === p1Id);
  const p2 = players.find(p => p.id === p2Id);

  const winnerId = p1Id && p2Id ? determineWinner(sets, p1Id, p2Id) : null;

  const canSave = p1Id && p2Id && p1Id !== p2Id && sets.some(s => s.p1 > 0 || s.p2 > 0);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const match = await logMatch({
      date,
      player1Id: p1Id,
      player2Id: p2Id,
      winnerId,
      sets,
      surface,
      format: 'best_of_3',
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (match) router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Player Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jogadores</Text>
        <View style={styles.playerSelect}>
          <View style={styles.playerCol}>
            <Text style={styles.playerLabel}>Jogador 1</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerScroll}>
              {players.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.playerChip, p1Id === p.id && styles.playerChipActive]}
                  onPress={() => setP1Id(p.id)}
                >
                  <View style={[styles.chipAvatar, { backgroundColor: p.avatarColor }]}>
                    <Text style={styles.chipAvatarText}>{p.name[0]}</Text>
                  </View>
                  <Text style={[styles.chipName, p1Id === p.id && styles.chipNameActive]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.vs}>VS</Text>

          <View style={styles.playerCol}>
            <Text style={styles.playerLabel}>Jogador 2</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerScroll}>
              {availableP2.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.playerChip, p2Id === p.id && styles.playerChipActive]}
                  onPress={() => setP2Id(p.id)}
                >
                  <View style={[styles.chipAvatar, { backgroundColor: p.avatarColor }]}>
                    <Text style={styles.chipAvatarText}>{p.name[0]}</Text>
                  </View>
                  <Text style={[styles.chipName, p2Id === p.id && styles.chipNameActive]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {availableP2.length === 0 && (
                <TouchableOpacity style={styles.addPlayerBtn} onPress={() => router.push('/players')}>
                  <Ionicons name="person-add-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.addPlayerText}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Surface */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Superfície</Text>
        <View style={styles.surfaceRow}>
          {SURFACES.map(s => {
            const color = SurfaceColors[s];
            return (
              <TouchableOpacity
                key={s}
                style={[styles.surfaceBtn, surface === s && { borderColor: color, backgroundColor: color + '20' }]}
                onPress={() => setSurface(s)}
              >
                <View style={[styles.surfaceDot, { backgroundColor: color }]} />
                <Text style={[styles.surfaceLabel, surface === s && { color }]}>{SURFACE_LABELS[s]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Placar</Text>
        {p1 && p2 && (
          <View style={styles.scoreHeader}>
            <Text style={styles.scorePlayer}>{p1.name}</Text>
            <Text style={styles.scoreDash}>×</Text>
            <Text style={[styles.scorePlayer, styles.right]}>{p2.name}</Text>
          </View>
        )}
        <SetScoreInput sets={sets} onChange={setSets} />
        {winnerId && (
          <View style={styles.winnerBanner}>
            <Ionicons name="trophy" size={16} color={Colors.accent} />
            <Text style={styles.winnerText}>
              {players.find(p => p.id === winnerId)?.name} venceu
            </Text>
          </View>
        )}
      </View>

      {/* Date */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Observações (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas da partida..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!canSave || saving}
      >
        {saving
          ? <ActivityIndicator color={Colors.bg} />
          : <Text style={styles.saveBtnText}>SALVAR PARTIDA</Text>}
      </TouchableOpacity>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.lg, padding: Spacing.md },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  playerSelect: { gap: Spacing.md },
  playerCol: { gap: Spacing.xs },
  playerLabel: { fontSize: Font.xs, color: Colors.textTertiary, fontWeight: '600' },
  playerScroll: { flexGrow: 0 },
  playerChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    marginRight: Spacing.xs, borderWidth: 2, borderColor: 'transparent',
  },
  playerChipActive: { borderColor: Colors.accent },
  chipAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipAvatarText: { fontSize: Font.xs, fontWeight: '800', color: Colors.bg },
  chipName: { fontSize: Font.sm, color: Colors.textSecondary, maxWidth: 100, fontWeight: '600' },
  chipNameActive: { color: Colors.text },
  vs: { fontSize: Font.xxl, fontWeight: '900', color: Colors.textTertiary, textAlign: 'center' },
  addPlayerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    padding: Spacing.sm, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  addPlayerText: { fontSize: Font.sm, color: Colors.textSecondary },
  surfaceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  surfaceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  surfaceDot: { width: 8, height: 8, borderRadius: 4 },
  surfaceLabel: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600' },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  scorePlayer: { flex: 1, fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '700' },
  scoreDash: { fontSize: Font.sm, color: Colors.textTertiary },
  right: { textAlign: 'right' },
  winnerBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Colors.accent + '20', borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  winnerText: { fontSize: Font.md, fontWeight: '700', color: Colors.accent },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.md, letterSpacing: 1 },
});
