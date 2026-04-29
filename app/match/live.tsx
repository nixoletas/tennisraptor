import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Font, SurfaceColors } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Surface, MatchFormat } from '../../constants/types';

const SURFACES: Surface[] = ['clay', 'hard', 'grass', 'carpet', 'indoor'];
const SURFACE_LABELS: Record<Surface, string> = {
  clay: 'Saibro', hard: 'Duro', grass: 'Grama', carpet: 'Carpete', indoor: 'Indoor',
};

export default function LiveMatchScreen() {
  const { liveMatch, startLive, awardGame, awardTiebreakPoint, finishLive, cancelLive } = useMatchStore();
  const { players, myPlayerId } = usePlayerStore();
  const [showSetup, setShowSetup] = useState(!liveMatch);
  const [p1Id, setP1Id] = useState(myPlayerId ?? '');
  const [p2Id, setP2Id] = useState('');
  const [surface, setSurface] = useState<Surface>('hard');

  const p1 = players.find(p => p.id === (liveMatch?.player1Id ?? p1Id));
  const p2 = players.find(p => p.id === (liveMatch?.player2Id ?? p2Id));

  const handleStart = () => {
    if (!p1Id || !p2Id || p1Id === p2Id) {
      Alert.alert('Selecione dois jogadores diferentes.');
      return;
    }
    startLive(p1Id, p2Id, surface, 'best_of_3');
    setShowSetup(false);
  };

  const handleFinish = () => {
    Alert.alert(
      'Finalizar Partida',
      'Salvar resultado atual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            await finishLive();
            router.replace('/(tabs)/history');
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert('Cancelar Partida', 'Descartar esta partida?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim, cancelar', style: 'destructive', onPress: () => { cancelLive(); router.back(); } },
    ]);
  };

  // Setup screen
  if (showSetup || !liveMatch) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.setupContent}>
        <Text style={styles.setupTitle}>Nova Partida</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jogador 1</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {players.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.playerChip, p1Id === p.id && styles.chipActive]}
                  onPress={() => setP1Id(p.id)}
                >
                  <View style={[styles.chipDot, { backgroundColor: p.avatarColor }]}>
                    <Text style={styles.chipDotText}>{p.name[0]}</Text>
                  </View>
                  <Text style={[styles.chipLabel, p1Id === p.id && styles.chipLabelActive]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jogador 2</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {players.filter(p => p.id !== p1Id).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.playerChip, p2Id === p.id && styles.chipActive]}
                  onPress={() => setP2Id(p.id)}
                >
                  <View style={[styles.chipDot, { backgroundColor: p.avatarColor }]}>
                    <Text style={styles.chipDotText}>{p.name[0]}</Text>
                  </View>
                  <Text style={[styles.chipLabel, p2Id === p.id && styles.chipLabelActive]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Superfície</Text>
          <View style={styles.surfaceRow}>
            {SURFACES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.surfaceBtn, surface === s && { borderColor: SurfaceColors[s], backgroundColor: SurfaceColors[s] + '20' }]}
                onPress={() => setSurface(s)}
              >
                <View style={[styles.surfaceDot, { backgroundColor: SurfaceColors[s] }]} />
                <Text style={[styles.surfaceLabel, surface === s && { color: SurfaceColors[s] }]}>{SURFACE_LABELS[s]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.startBtn, (!p1Id || !p2Id) && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!p1Id || !p2Id}
        >
          <Ionicons name="radio-button-on" size={20} color={Colors.bg} />
          <Text style={styles.startBtnText}>INICIAR</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Live tracking screen
  const live = liveMatch;
  const p1Sets = live.sets.filter(s => s.p1 > s.p2).length;
  const p2Sets = live.sets.filter(s => s.p2 > s.p1).length;

  const surfColor = SurfaceColors[live.surface];

  const awardPoint = (winnerId: string) => {
    if (live.isTiebreak) {
      awardTiebreakPoint(winnerId);
    } else {
      awardGame(winnerId);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A0000', Colors.bg]} style={styles.liveHeader}>
        <View style={styles.liveMeta}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>AO VIVO</Text>
          <View style={[styles.surfaceTag, { backgroundColor: surfColor + '30' }]}>
            <Text style={[styles.surfaceTagText, { color: surfColor }]}>{SURFACE_LABELS[live.surface]}</Text>
          </View>
        </View>

        {/* Sets display */}
        <View style={styles.setsRow}>
          {live.sets.map((s, i) => (
            <View key={i} style={styles.setScore}>
              <Text style={[styles.setNum, s.p1 > s.p2 && styles.setWon]}>{s.p1}</Text>
              <Text style={styles.setDivider}>-</Text>
              <Text style={[styles.setNum, s.p2 > s.p1 && styles.setWon]}>{s.p2}</Text>
            </View>
          ))}
        </View>

        {/* Current score */}
        <View style={styles.scoreBoard}>
          <View style={styles.scoreCol}>
            <View style={[styles.playerAvatarLg, { backgroundColor: p1?.avatarColor ?? Colors.card }]}>
              <Text style={styles.playerAvatarLgText}>{p1?.name?.[0]}</Text>
            </View>
            <Text style={styles.scoreName} numberOfLines={1}>{p1?.name}</Text>
            <Text style={styles.setsCount}>{p1Sets}</Text>
            <Text style={styles.gamesCount}>
              {live.isTiebreak ? live.p1TiebreakPoints : live.p1CurrentGames}
            </Text>
          </View>

          <View style={styles.scoreDivider}>
            <Text style={styles.scoreDividerText}>SET {live.currentSet + 1}</Text>
            {live.isTiebreak && <Text style={styles.tiebreakLabel}>TIEBREAK</Text>}
          </View>

          <View style={styles.scoreCol}>
            <View style={[styles.playerAvatarLg, { backgroundColor: p2?.avatarColor ?? Colors.card }]}>
              <Text style={styles.playerAvatarLgText}>{p2?.name?.[0]}</Text>
            </View>
            <Text style={styles.scoreName} numberOfLines={1}>{p2?.name}</Text>
            <Text style={styles.setsCount}>{p2Sets}</Text>
            <Text style={styles.gamesCount}>
              {live.isTiebreak ? live.p2TiebreakPoints : live.p2CurrentGames}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Game buttons */}
      {live.isComplete ? (
        <View style={styles.winnerSection}>
          <Ionicons name="trophy" size={64} color={Colors.accent} />
          <Text style={styles.winnerTitle}>
            {players.find(p => p.id === live.winnerId)?.name} venceu!
          </Text>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>SALVAR PARTIDA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttons}>
          <Text style={styles.buttonsLabel}>
            {live.isTiebreak ? 'QUEM GANHOU O PONTO?' : 'QUEM GANHOU O GAME?'}
          </Text>
          <View style={styles.gameRow}>
            <TouchableOpacity
              style={[styles.gameBtn, { backgroundColor: p1?.avatarColor ?? Colors.accent }]}
              onPress={() => awardPoint(live.player1Id)}
            >
              <Text style={styles.gameBtnText}>{p1?.name?.split(' ')[0]}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gameBtn, { backgroundColor: p2?.avatarColor ?? Colors.blue }]}
              onPress={() => awardPoint(live.player2Id)}
            >
              <Text style={styles.gameBtnText}>{p2?.name?.split(' ')[0]}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleFinish}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.green} />
              <Text style={[styles.controlText, { color: Colors.green }]}>Finalizar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={handleCancel}>
              <Ionicons name="close-circle-outline" size={18} color={Colors.red} />
              <Text style={[styles.controlText, { color: Colors.red }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  setupContent: { padding: Spacing.lg, gap: Spacing.lg },
  setupTitle: { fontSize: Font.xxl, fontWeight: '900', color: Colors.text },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', gap: Spacing.xs },
  playerChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 2, borderColor: 'transparent',
  },
  chipActive: { borderColor: Colors.accent },
  chipDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipDotText: { fontSize: Font.xs, fontWeight: '800', color: Colors.bg },
  chipLabel: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600' },
  chipLabelActive: { color: Colors.text },
  surfaceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  surfaceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  surfaceDot: { width: 8, height: 8, borderRadius: 4 },
  surfaceLabel: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { color: Colors.bg, fontWeight: '900', fontSize: Font.lg, letterSpacing: 1 },
  liveHeader: { flex: 1, padding: Spacing.lg, gap: Spacing.lg, justifyContent: 'center' },
  liveMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red },
  liveLabel: { fontSize: Font.xs, fontWeight: '800', color: Colors.red, letterSpacing: 2, flex: 1 },
  surfaceTag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  surfaceTagText: { fontSize: Font.xs, fontWeight: '700' },
  setsRow: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  setScore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  setNum: { fontSize: Font.xl, fontWeight: '800', color: Colors.textSecondary },
  setWon: { color: Colors.text },
  setDivider: { fontSize: Font.sm, color: Colors.textTertiary },
  scoreBoard: { flexDirection: 'row', alignItems: 'center' },
  scoreCol: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  playerAvatarLg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  playerAvatarLgText: { fontSize: Font.xxl, fontWeight: '900', color: Colors.bg },
  scoreName: { fontSize: Font.md, fontWeight: '700', color: Colors.text },
  setsCount: { fontSize: Font.display, fontWeight: '900', color: Colors.accent, letterSpacing: -2 },
  gamesCount: { fontSize: Font.xl, fontWeight: '800', color: Colors.textSecondary },
  scoreDivider: { width: 40, alignItems: 'center', gap: 4 },
  scoreDividerText: { fontSize: Font.xs, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.5 },
  tiebreakLabel: { fontSize: Font.xs, fontWeight: '800', color: Colors.orange, letterSpacing: 0.5 },
  buttons: { padding: Spacing.lg, gap: Spacing.md, backgroundColor: Colors.surface },
  buttonsLabel: { fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary, textAlign: 'center', letterSpacing: 1 },
  gameRow: { flexDirection: 'row', gap: Spacing.sm },
  gameBtn: {
    flex: 1, padding: Spacing.xl, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  gameBtnText: { fontSize: Font.xl, fontWeight: '900', color: Colors.bg },
  controlRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl },
  controlBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.sm },
  controlText: { fontSize: Font.sm, fontWeight: '700' },
  winnerSection: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.lg, backgroundColor: Colors.surface,
  },
  winnerTitle: { fontSize: Font.xxl, fontWeight: '900', color: Colors.accent, textAlign: 'center' },
  finishBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
  },
  finishBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.lg, letterSpacing: 1 },
});
