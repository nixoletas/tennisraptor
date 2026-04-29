import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font, PLAY_STYLE_LABELS } from '../../constants/theme';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useMatchStore } from '../../stores/useMatchStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { PlayerCard } from '../../components/PlayerCard';
import { Profile } from '../../constants/types';

type Tab = 'nearby' | 'roster';

export default function PlayersScreen() {
  const { players, addPlayer } = usePlayerStore();
  const { getPlayerStats } = useMatchStore();
  const me = useProfileStore(s => s.me);
  const nearby = useProfileStore(s => s.nearby);

  const [tab, setTab] = useState<Tab>('nearby');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const q = search.toLowerCase().trim();

  // Proximity ranking: same city > same state > others.
  // Filtra a partir do me.regionState/regionCity, mantendo ordem por proximidade.
  const sortedNearby = useMemo(() => {
    const rank = (p: Profile) => {
      if (me?.regionCity && p.regionCity?.toLowerCase() === me.regionCity.toLowerCase()
          && p.regionState === me.regionState) return 0;
      if (me?.regionState && p.regionState === me.regionState) return 1;
      return 2;
    };
    return [...nearby].sort((a, b) => rank(a) - rank(b));
  }, [nearby, me?.regionState, me?.regionCity]);

  const filteredNearby = sortedNearby.filter(p =>
    !q || p.name.toLowerCase().includes(q) || (p.handle ?? '').toLowerCase().includes(q)
      || (p.regionCity ?? '').toLowerCase().includes(q)
  );

  const filteredRoster = players.filter(p => p.name.toLowerCase().includes(q));

  const rosterKey = (name: string, handle?: string) =>
    `${name.toLowerCase()}|${(handle ?? '').toLowerCase()}`;
  const rosterIndex = new Set(players.map(p => rosterKey(p.name, p.handle)));

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addPlayer(newName.trim());
    setNewName('');
    setShowAdd(false);
  };

  const handleAddFromProfile = async (profileId: string, name: string, handle?: string) => {
    if (adding) return;
    setAdding(profileId);
    await addPlayer(name, handle);
    setAdding(null);
  };

  const sameCityCount = me?.regionCity
    ? sortedNearby.filter(p =>
        p.regionCity?.toLowerCase() === me.regionCity?.toLowerCase()
        && p.regionState === me.regionState
      ).length
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'nearby' && styles.tabActive]}
          onPress={() => setTab('nearby')}
        >
          <Ionicons name="location" size={14} color={tab === 'nearby' ? Colors.accent : Colors.textSecondary} />
          <Text style={[styles.tabText, tab === 'nearby' && styles.tabTextActive]}>
            Perto de mim
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'roster' && styles.tabActive]}
          onPress={() => setTab('roster')}
        >
          <Text style={[styles.tabText, tab === 'roster' && styles.tabTextActive]}>
            Meus ({players.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={tab === 'nearby' ? 'Nome, @handle ou cidade…' : 'Buscar adversário…'}
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {tab === 'roster' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="person-add" size={20} color={Colors.bg} />
          </TouchableOpacity>
        )}
      </View>

      {tab === 'nearby' && me && (
        <View style={styles.regionBanner}>
          <Ionicons name="navigate" size={14} color={Colors.accent} />
          <Text style={styles.regionText}>
            {me.regionCity ?? '—'}{me.regionState ? `, ${me.regionState}` : ''}
            {sameCityCount > 0 && ` · ${sameCityCount} na sua cidade`}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {tab === 'nearby' && (
          <>
            {filteredNearby.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="location-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Ninguém perto ainda</Text>
                <Text style={styles.emptyText}>
                  Convide amigos pra TennisRaptor e construa sua rivalidade local.
                </Text>
              </View>
            ) : (
              filteredNearby.map(p => {
                const inRoster = rosterIndex.has(rosterKey(p.name, p.handle));
                const isAdding = adding === p.id;
                const sameCity = me?.regionCity
                  && p.regionCity?.toLowerCase() === me.regionCity.toLowerCase()
                  && p.regionState === me.regionState;
                const sameState = !sameCity && me?.regionState && p.regionState === me.regionState;
                return (
                  <View key={p.id} style={styles.profileRow}>
                    {p.avatarUrl ? (
                      <Image source={{ uri: p.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: p.avatarColor ?? Colors.blue, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={styles.avatarText}>{p.name[0]?.toUpperCase() ?? '?'}</Text>
                      </View>
                    )}
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{p.name}</Text>
                      <View style={styles.profileMeta}>
                        {sameCity && <Badge label="Mesma cidade" tone="accent" />}
                        {sameState && <Badge label={p.regionState ?? ''} tone="muted" />}
                        {!sameCity && !sameState && p.regionState && <Badge label={p.regionState} tone="muted" />}
                        {p.playStyle && <Badge label={PLAY_STYLE_LABELS[p.playStyle]} tone="muted" />}
                      </View>
                    </View>
                    {inRoster ? (
                      <View style={styles.addedBadge}>
                        <Ionicons name="checkmark" size={14} color={Colors.green} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.addProfileBtn, isAdding && styles.addProfileBtnDisabled]}
                        onPress={() => handleAddFromProfile(p.id, p.name, p.handle)}
                        disabled={isAdding}
                      >
                        <Ionicons name="add" size={18} color={Colors.bg} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {tab === 'roster' && (
          <>
            {filteredRoster.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Nenhum adversário</Text>
                <Text style={styles.emptyText}>Adicione adversários pra registrar partidas.</Text>
              </View>
            ) : (
              filteredRoster.map(player => {
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
              })
            )}
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Novo Adversário</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do adversário"
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

function Badge({ label, tone }: { label: string; tone: 'accent' | 'muted' }) {
  const accent = tone === 'accent';
  return (
    <View style={[styles.badge, accent ? styles.badgeAccent : styles.badgeMuted]}>
      <Text style={[styles.badgeText, accent && styles.badgeTextAccent]}>{label}</Text>
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
  tab: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { fontSize: Font.sm, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.accent },

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

  regionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
  },
  regionText: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.3 },

  list: { padding: Spacing.md, gap: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  emptyTitle: { fontSize: Font.lg, fontWeight: '700', color: Colors.textSecondary },
  emptyText: { fontSize: Font.sm, color: Colors.textTertiary, textAlign: 'center' },

  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: Font.md, fontWeight: '800', color: Colors.bg },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: Font.md, fontWeight: '700', color: Colors.text },
  profileMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  badgeAccent: { backgroundColor: Colors.accent + '25' },
  badgeMuted: { backgroundColor: Colors.border },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3 },
  badgeTextAccent: { color: Colors.accent },

  addProfileBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  addProfileBtnDisabled: { opacity: 0.5 },
  addedBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.green + '20', alignItems: 'center', justifyContent: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
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
