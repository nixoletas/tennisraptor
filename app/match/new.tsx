import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
  Modal, Image, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { SetScoreInput } from '../../components/SetScoreInput';
import { SurfaceCard } from '../../components/SurfaceCard';
import { Surface, MatchSet, Profile } from '../../constants/types';

type Mode = 'singles' | 'doubles';

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
  const me = useProfileStore(s => s.me);
  const nearby = useProfileStore(s => s.nearby);

  const profilesMap = useMemo(() => {
    const m = new Map<string, Profile>();
    if (me) m.set(me.id, me);
    for (const p of nearby) m.set(p.id, p);
    return m;
  }, [me, nearby]);

  const [mode, setMode] = useState<Mode>('singles');
  const [saving, setSaving] = useState(false);
  const [pickerFor, setPickerFor] = useState<'p1' | 'p2' | null>(null);

  const [p1Id, setP1Id] = useState(me?.id ?? '');
  const [p2Id, setP2Id] = useState('');
  const [surface, setSurface] = useState<Surface>('hard');
  const [sets, setSets] = useState<MatchSet[]>([{ p1: 0, p2: 0 }]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [notes, setNotes] = useState('');

  const p1 = profilesMap.get(p1Id);
  const p2 = profilesMap.get(p2Id);

  const winnerId = p1Id && p2Id ? determineWinner(sets, p1Id, p2Id) : null;
  const canSave = p1Id && p2Id && p1Id !== p2Id && sets.some(s => s.p1 > 0 || s.p2 > 0);

  const handlePickProfile = (profile: Profile) => {
    if (pickerFor === 'p1') setP1Id(profile.id);
    else if (pickerFor === 'p2') setP2Id(profile.id);
    setPickerFor(null);
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const match = await logMatch({
      date,
      scheduledTime: time.trim() || undefined,
      location: location.trim() || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
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

      {/* Modo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'singles' && styles.modeBtnActive]}
            onPress={() => setMode('singles')}
          >
            <Ionicons name="person" size={18} color={mode === 'singles' ? Colors.bg : Colors.text} />
            <Text style={[styles.modeLabel, mode === 'singles' && styles.modeLabelActive]}>Simples</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, styles.modeBtnDisabled]}
            onPress={() => {}}
            disabled
          >
            <Ionicons name="people" size={18} color={Colors.textTertiary} />
            <Text style={[styles.modeLabel, { color: Colors.textTertiary }]}>Dupla</Text>
            <View style={styles.soonBadge}><Text style={styles.soonText}>EM BREVE</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Surface */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Superfície</Text>
        <View style={styles.surfaceList}>
          {(['clay', 'hard', 'grass'] as const).map(s => (
            <SurfaceCard
              key={s}
              surface={s}
              selected={surface === s}
              onPress={() => setSurface(s)}
              variant="compact"
              style={styles.surfaceItem}
            />
          ))}
        </View>
      </View>

      {/* Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Placar</Text>
        <SetScoreInput
          sets={sets}
          onChange={setSets}
          surface={surface}
          p1Name={p1?.name}
          p2Name={p2?.name}
          onPressP1={() => setPickerFor('p1')}
          onPressP2={() => setPickerFor('p2')}
        />
        {winnerId && (
          <View style={styles.winnerBanner}>
            <Ionicons name="trophy" size={16} color={Colors.accent} />
            <Text style={styles.winnerText}>
              {profilesMap.get(winnerId)?.name} venceu
            </Text>
          </View>
        )}
      </View>

      {/* Quando + Onde */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quando</Text>
        <View style={styles.row2}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.fieldLabel}>Data</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.fieldLabel}>Horário</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Onde</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Clube, quadra, cidade…"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banner (foto)</Text>
        <TextInput
          style={styles.input}
          value={bannerUrl}
          onChangeText={setBannerUrl}
          placeholder="URL da foto da partida (opcional)"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre a partida</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Como foi o jogo? Highlights, sentimentos, drama…"
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
        />
      </View>

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

      <ProfilePickerModal
        visible={!!pickerFor}
        onClose={() => setPickerFor(null)}
        me={me}
        nearby={nearby}
        excludeId={pickerFor === 'p1' ? p2Id : p1Id}
        onPick={handlePickProfile}
      />
    </ScrollView>
  );
}

// ============== Profile picker modal ==============

function ProfilePickerModal({
  visible, onClose, me, nearby, excludeId, onPick,
}: {
  visible: boolean;
  onClose: () => void;
  me: Profile | null;
  nearby: Profile[];
  excludeId: string;
  onPick: (p: Profile) => void;
}) {
  const [q, setQ] = useState('');

  const all = useMemo(() => {
    const list: Profile[] = [];
    if (me) list.push(me);
    list.push(...nearby);
    return list.filter(p => p.id !== excludeId);
  }, [me, nearby, excludeId]);

  const filtered = q.trim()
    ? all.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase())
        || (p.handle ?? '').toLowerCase().includes(q.toLowerCase())
      )
    : all;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar jogador</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome ou @handle…"
              placeholderTextColor={Colors.textTertiary}
              value={q}
              onChangeText={setQ}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={p => p.id}
            contentContainerStyle={{ paddingBottom: Spacing.xxl }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <View style={styles.emptyPicker}>
                <Ionicons name="search" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyPickerText}>Nenhum jogador encontrado</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = me?.id === item.id;
              return (
                <TouchableOpacity style={styles.pickerRow} onPress={() => onPick(item)}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.pickerAvatar} />
                  ) : (
                    <View style={[styles.pickerAvatar, { backgroundColor: item.avatarColor ?? Colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={styles.pickerInitial}>{item.name[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName}>{item.name}</Text>
                    {item.handle && <Text style={styles.pickerHandle}>@{item.handle}</Text>}
                  </View>
                  {isMe && (
                    <View style={styles.rosterBadge}>
                      <Text style={styles.rosterBadgeText}>EU</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.lg, paddingBottom: Spacing.lg },

  hero: {
    height: 100, marginHorizontal: Spacing.md,
    borderRadius: Radius.lg, overflow: 'hidden',
    padding: Spacing.lg, justifyContent: 'flex-end',
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000040' },
  heroSlam: { fontSize: Font.xs, fontWeight: '900', color: '#FFFFFFCC', letterSpacing: 2 },
  heroTitle: { fontSize: Font.xxl, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },

  section: { gap: Spacing.sm, paddingHorizontal: Spacing.md },
  sectionTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  fieldLabel: { fontSize: Font.xs, color: Colors.textTertiary, fontWeight: '600' },

  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 2, borderColor: Colors.border,
    position: 'relative',
  },
  modeBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  modeBtnDisabled: { opacity: 0.6 },
  modeLabel: { fontSize: Font.md, fontWeight: '800', color: Colors.text },
  modeLabelActive: { color: Colors.bg },
  soonBadge: {
    position: 'absolute', top: -8, right: -4,
    backgroundColor: Colors.orange, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  soonText: { fontSize: 9, fontWeight: '900', color: Colors.bg, letterSpacing: 0.5 },

  surfaceList: { flexDirection: 'row', gap: Spacing.sm },
  surfaceItem: { flex: 1, minHeight: 76 },

  winnerBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Colors.accent + '20', borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  winnerText: { fontSize: Font.md, fontWeight: '700', color: Colors.accent },

  row2: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { height: 100, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md, alignItems: 'center',
    marginHorizontal: Spacing.md, marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: Colors.bg, fontWeight: '900', fontSize: Font.md, letterSpacing: 1.5 },

  // Modal
  modalRoot: { flex: 1, backgroundColor: '#000000A0', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  modalTitle: { fontSize: Font.xl, fontWeight: '900', color: Colors.text },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 44,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: Font.md },
  sep: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  pickerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pickerInitial: { fontSize: Font.md, fontWeight: '900', color: Colors.bg },
  pickerName: { fontSize: Font.md, fontWeight: '700', color: Colors.text },
  pickerHandle: { fontSize: Font.sm, color: Colors.textSecondary },
  platformBadge: { backgroundColor: Colors.blue + '30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  platformBadgeText: { fontSize: 10, fontWeight: '900', color: Colors.blue, letterSpacing: 0.5 },
  rosterBadge: { backgroundColor: Colors.accent + '30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  rosterBadgeText: { fontSize: 10, fontWeight: '900', color: Colors.accent, letterSpacing: 0.5 },
  emptyPicker: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xxl },
  emptyPickerText: { fontSize: Font.sm, color: Colors.textSecondary },
});
