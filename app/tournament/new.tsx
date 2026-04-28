import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Font, SurfaceColors } from '../../constants/theme';
import { useTournamentStore } from '../../stores/useTournamentStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { PlayerCard } from '../../components/PlayerCard';
import { Surface, TournamentFormat } from '../../constants/types';
import { Ionicons } from '@expo/vector-icons';

const SURFACES: Surface[] = ['clay', 'hard', 'grass', 'carpet', 'indoor'];
const SURFACE_LABELS: Record<Surface, string> = {
  clay: 'Saibro', hard: 'Duro', grass: 'Grama', carpet: 'Carpete', indoor: 'Indoor',
};

const FORMATS: TournamentFormat[] = ['round_robin', 'single_elim', 'groups'];
const FORMAT_LABELS: Record<TournamentFormat, string> = {
  round_robin: 'Round Robin', single_elim: 'Eliminação Simples', groups: 'Grupos',
};
const FORMAT_DESC: Record<TournamentFormat, string> = {
  round_robin: 'Todos contra todos', single_elim: 'Mata-mata direto', groups: 'Fase de grupos',
};

export default function NewTournamentScreen() {
  const { createTournament } = useTournamentStore();
  const { players } = usePlayerStore();

  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('round_robin');
  const [surface, setSurface] = useState<Surface>('hard');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const canCreate = name.trim().length > 0 && selectedPlayers.length >= 2;

  const handleCreate = () => {
    if (!canCreate) return;
    createTournament({
      name: name.trim(),
      format,
      surface,
      startDate,
      playerIds: selectedPlayers,
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nome do Torneio</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Copa de Verão 2025"
          placeholderTextColor={Colors.textTertiary}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Formato</Text>
        {FORMATS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.formatBtn, format === f && styles.formatBtnActive]}
            onPress={() => setFormat(f)}
          >
            <View style={styles.formatIcon}>
              <Ionicons
                name={f === 'round_robin' ? 'reload' : f === 'single_elim' ? 'git-branch' : 'grid'}
                size={20}
                color={format === f ? Colors.bg : Colors.textSecondary}
              />
            </View>
            <View style={styles.formatInfo}>
              <Text style={[styles.formatName, format === f && styles.formatNameActive]}>
                {FORMAT_LABELS[f]}
              </Text>
              <Text style={styles.formatDesc}>{FORMAT_DESC[f]}</Text>
            </View>
            {format === f && <Ionicons name="checkmark-circle" size={20} color={Colors.bg} />}
          </TouchableOpacity>
        ))}
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data de Início</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Jogadores</Text>
          <Text style={styles.selectedCount}>{selectedPlayers.length} selecionados</Text>
        </View>
        {players.length === 0 ? (
          <TouchableOpacity style={styles.addPlayersBtn} onPress={() => router.push('/players')}>
            <Ionicons name="person-add-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.addPlayersText}>Adicionar jogadores primeiro</Text>
          </TouchableOpacity>
        ) : (
          players.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => togglePlayer(p.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.playerRow, selectedPlayers.includes(p.id) && styles.playerRowSelected]}>
                <View style={[styles.playerAvatar, { backgroundColor: p.avatarColor }]}>
                  <Text style={styles.playerAvatarText}>{p.name[0]}</Text>
                </View>
                <Text style={styles.playerName}>{p.name}</Text>
                {selectedPlayers.includes(p.id) && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
        onPress={handleCreate}
        disabled={!canCreate}
      >
        <Text style={styles.createBtnText}>CRIAR TORNEIO</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.lg, padding: Spacing.md },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  selectedCount: { fontSize: Font.xs, color: Colors.accent, fontWeight: '700' },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  formatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 2, borderColor: 'transparent',
  },
  formatBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  formatIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg + '40', alignItems: 'center', justifyContent: 'center' },
  formatInfo: { flex: 1 },
  formatName: { fontSize: Font.md, fontWeight: '700', color: Colors.textSecondary },
  formatNameActive: { color: Colors.bg },
  formatDesc: { fontSize: Font.xs, color: Colors.textTertiary },
  surfaceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  surfaceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  surfaceDot: { width: 8, height: 8, borderRadius: 4 },
  surfaceLabel: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600' },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 2, borderColor: 'transparent',
  },
  playerRowSelected: { borderColor: Colors.accent + '60' },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { fontSize: Font.md, fontWeight: '800', color: Colors.bg },
  playerName: { flex: 1, fontSize: Font.md, fontWeight: '600', color: Colors.text },
  addPlayersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    justifyContent: 'center',
  },
  addPlayersText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md, alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.md, letterSpacing: 1 },
});
