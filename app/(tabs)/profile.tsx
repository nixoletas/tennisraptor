import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useMatchStore } from '../../stores/useMatchStore';
import { StatCard } from '../../components/StatCard';
import { useAuth } from '../../lib/AuthContext';

export default function ProfileScreen() {
  const { players, myPlayerId, setupMe } = usePlayerStore();
  const { getPlayerStats, matches } = useMatchStore();
  const { user, signOut } = useAuth();
  const me = players.find(p => p.id === myPlayerId);

  const [showSetup, setShowSetup] = useState(!me);
  const [name, setName] = useState(me?.name ?? '');
  const [handle, setHandle] = useState(me?.handle ?? '');

  const stats = myPlayerId ? getPlayerStats(myPlayerId) : null;
  const myMatches = matches.filter(m => m.player1Id === myPlayerId || m.player2Id === myPlayerId);

  const surfaceCounts: Record<string, number> = {};
  for (const m of myMatches) {
    surfaceCounts[m.surface] = (surfaceCounts[m.surface] ?? 0) + 1;
  }
  const favSurface = Object.entries(surfaceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const SURFACE_LABELS: Record<string, string> = {
    clay: 'Saibro', hard: 'Duro', grass: 'Grama', carpet: 'Carpete', indoor: 'Indoor',
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    await setupMe(user.id, name.trim(), handle.trim() || undefined);
    setShowSetup(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          try { await signOut(); } catch {}
        },
      },
    ]);
  };

  if (!me) {
    return (
      <View style={styles.container}>
        <View style={styles.setupContainer}>
          <Ionicons name="tennisball" size={64} color={Colors.accent} />
          <Text style={styles.setupTitle}>Bem-vindo ao TennisRaptor</Text>
          <Text style={styles.setupSub}>Configure seu perfil para começar a rastrear suas partidas.</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="@handle (opcional)"
            placeholderTextColor={Colors.textTertiary}
            value={handle}
            onChangeText={setHandle}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>COMEÇAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.bigAvatar, { backgroundColor: me.avatarColor }]}>
          <Text style={styles.bigAvatarText}>{me.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{me.name}</Text>
          {me.handle && <Text style={styles.profileHandle}>@{me.handle}</Text>}
        </View>
        <TouchableOpacity onPress={() => setShowSetup(true)} style={styles.editBtn}>
          <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Vitórias" value={stats.wins} accent flex={1} />
            <StatCard label="Derrotas" value={stats.losses} flex={1} />
            <StatCard label="Win Rate" value={`${Math.round(stats.winRate * 100)}%`} flex={1} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard label="Sets W" value={stats.setsWon} flex={1} />
            <StatCard label="Sets D" value={stats.setsLost} flex={1} />
            <StatCard label="Games W" value={stats.gamesWon} flex={1} />
          </View>
          {favSurface && (
            <View style={styles.favCard}>
              <Text style={styles.favLabel}>Superfície Favorita</Text>
              <Text style={styles.favValue}>{SURFACE_LABELS[favSurface] ?? favSurface}</Text>
              <Text style={styles.favSub}>{surfaceCounts[favSurface]} partida{surfaceCounts[favSurface] !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      )}

      {/* Recent form */}
      {myMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forma Recente</Text>
          <View style={styles.formRow}>
            {myMatches.slice(0, 10).map((m, i) => {
              const won = m.winnerId === myPlayerId;
              return (
                <View key={m.id} style={[styles.formDot, { backgroundColor: won ? Colors.green : Colors.red }]}>
                  <Text style={styles.formDotText}>{won ? 'V' : 'D'}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        {user?.email && (
          <View style={styles.accountRow}>
            <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.accountEmail}>{user.email}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xl }} />

      {/* Edit Modal */}
      <Modal visible={showSetup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="@handle (opcional)"
              placeholderTextColor={Colors.textTertiary}
              value={handle}
              onChangeText={setHandle}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSetup(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSave}>
                <Text style={styles.confirmText}>SALVAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxl },
  setupContainer: {
    flex: 1, padding: Spacing.xl, justifyContent: 'center', alignItems: 'center', gap: Spacing.md,
  },
  setupTitle: { fontSize: Font.xxl, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  setupSub: { fontSize: Font.md, color: Colors.textSecondary, textAlign: 'center' },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg,
  },
  bigAvatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: { fontSize: Font.xxxl, fontWeight: '900', color: Colors.bg },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  profileHandle: { fontSize: Font.md, color: Colors.textSecondary },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  section: { gap: Spacing.sm, paddingHorizontal: Spacing.md },
  sectionTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  favCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, gap: 2,
  },
  favLabel: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
  favValue: { fontSize: Font.xl, fontWeight: '800', color: Colors.accent },
  favSub: { fontSize: Font.xs, color: Colors.textTertiary },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  formDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  formDotText: { fontSize: Font.xs, fontWeight: '800', color: Colors.text },
  accountRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
  },
  accountEmail: { fontSize: Font.sm, color: Colors.textSecondary, flex: 1 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.red + '15', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.red + '30',
  },
  signOutText: { fontSize: Font.md, color: Colors.red, fontWeight: '700' },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border, width: '100%',
  },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, width: '100%', alignItems: 'center',
  },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.md, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl, alignItems: 'center',
  },
  modalTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.text, alignSelf: 'flex-start' },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  cancelBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.card, alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '700' },
  confirmBtn: {
    flex: 2, padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.accent, alignItems: 'center',
  },
  confirmText: { color: Colors.bg, fontWeight: '800', letterSpacing: 0.5 },
});
