import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useMatchStore } from '../../stores/useMatchStore';
import { PlayerCard } from '../../components/PlayerCard';

export default function PlayersScreen() {
  const { players, addPlayer } = usePlayerStore();
  const { getPlayerStats } = useMatchStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newName.trim()) return;
    addPlayer(newName.trim());
    setNewName('');
    setShowAdd(false);
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar jogador..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="person-add" size={20} color={Colors.bg} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyTitle}>Nenhum jogador</Text>
            <Text style={styles.emptyText}>Adicione adversários para comparar estatísticas.</Text>
          </View>
        )}

        {filtered.map(player => {
          const stats = getPlayerStats(player.id);
          return (
            <PlayerCard
              key={player.id}
              player={player}
              wins={stats.wins}
              losses={stats.losses}
              onPress={() => router.push(`/player/${player.id}`)}
            />
          );
        })}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Add Player Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Novo Jogador</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do jogador"
              placeholderTextColor={Colors.textTertiary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleAdd}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
                <Text style={styles.confirmText}>ADICIONAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 44,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: Font.md },
  addBtn: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: Spacing.md, gap: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: Font.lg, fontWeight: '700', color: Colors.textSecondary },
  emptyText: { fontSize: Font.sm, color: Colors.textTertiary, textAlign: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg, gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
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
