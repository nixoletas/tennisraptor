import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, Modal, Image, FlatList, Platform, ActionSheetIOS,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { SetScoreInput } from '../../components/SetScoreInput';
import { SurfaceCard } from '../../components/SurfaceCard';
import { Surface, MatchSet, Profile } from '../../constants/types';

// React 19 + FC<> return type compat workaround
const DateTimePicker = RNDateTimePicker as unknown as React.ComponentType<React.ComponentProps<typeof RNDateTimePicker>>;

type Mode = 'singles' | 'doubles';

interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

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

// ─── Location search modal ────────────────────────────────────────────────────

function LocationModal({
  visible,
  initial,
  onClose,
  onSelect,
}: {
  visible: boolean;
  initial: string;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<GooglePlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

  const search = (q: string) => {
    setQuery(q);
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    if (!googleMapsKey) {
      setResults([]);
      setError('Configure EXPO_PUBLIC_GOOGLE_MAPS_KEY para buscar lugares reais.');
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          input: q,
          key: googleMapsKey,
          language: 'pt-BR',
          components: 'country:br',
        });
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
        );
        const data = (await res.json()) as {
          status: string;
          error_message?: string;
          predictions?: GooglePlacePrediction[];
        };
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          setError(data.error_message ?? 'Não foi possível buscar no Google Places.');
          setResults([]);
          return;
        }
        setResults(data.predictions ?? []);
      } catch {
        setError('Não foi possível buscar locais agora.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const confirm = () => {
    if (query.trim()) onSelect(query.trim());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ls.root}>
        <View style={ls.sheet}>
          <View style={ls.header}>
            <Text style={ls.title}>Onde foi a partida?</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={ls.searchBox}>
            <Ionicons name="search" size={16} color={Colors.textSecondary} />
            <TextInput
              style={ls.searchInput}
              placeholder="Clube, quadra, cidade…"
              placeholderTextColor={Colors.textTertiary}
              value={query}
              onChangeText={search}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirm}
            />
            {loading && <ActivityIndicator size="small" color={Colors.accent} />}
          </View>

          <FlatList
            data={results}
            keyExtractor={r => r.place_id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.trim() && !loading ? (
                <View style={ls.empty}>
                  <Text style={ls.emptyText}>{error || 'Nenhum local encontrado'}</Text>
                  <TouchableOpacity style={ls.useRaw} onPress={confirm}>
                    <Text style={ls.useRawText}>Usar "{query}" mesmo assim</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            renderItem={({ item }: { item: GooglePlacePrediction }) => (
              <TouchableOpacity
                style={ls.row}
                onPress={() => { onSelect(item.description); onClose(); }}
              >
                <Ionicons name="location-outline" size={18} color={Colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={ls.rowMainText} numberOfLines={1}>
                    {item.structured_formatting?.main_text ?? item.description}
                  </Text>
                  {!!item.structured_formatting?.secondary_text && (
                    <Text style={ls.rowSecondaryText} numberOfLines={1}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={ls.sep} />}
          />
        </View>
      </View>
    </Modal>
  );
}

const ls = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000A0', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md, height: '80%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  title: { fontSize: Font.xl, fontWeight: '900', color: Colors.text },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 44,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: Font.md },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  rowMainText: { color: Colors.text, fontSize: Font.md, fontWeight: '700' },
  rowSecondaryText: { color: Colors.textSecondary, fontSize: Font.sm, marginTop: 2 },
  sep: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  empty: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xxl },
  emptyText: { fontSize: Font.sm, color: Colors.textSecondary },
  useRaw: {
    backgroundColor: Colors.accent + '20', borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  useRawText: { fontSize: Font.sm, fontWeight: '700', color: Colors.accent },
});

// ─── Banner action sheet / modal ──────────────────────────────────────────────

function BannerPickerModal({
  visible,
  onClose,
  onPickGallery,
  onPickCamera,
}: {
  visible: boolean;
  onClose: () => void;
  onPickGallery: () => Promise<void>;
  onPickCamera: () => Promise<void>;
}) {
  if (Platform.OS === 'ios') return null; // iOS uses ActionSheetIOS directly

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={bp.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={bp.sheet}>
          <Text style={bp.title}>Banner da partida</Text>
          <TouchableOpacity style={bp.option} onPress={() => { onClose(); setTimeout(onPickCamera, 250); }}>
            <Ionicons name="camera-outline" size={22} color={Colors.text} />
            <Text style={bp.optionText}>Tirar foto</Text>
          </TouchableOpacity>
          <View style={bp.sep} />
          <TouchableOpacity style={bp.option} onPress={() => { onClose(); setTimeout(onPickGallery, 250); }}>
            <Ionicons name="image-outline" size={22} color={Colors.text} />
            <Text style={bp.optionText}>Escolher da galeria</Text>
          </TouchableOpacity>
          <View style={bp.sep} />
          <TouchableOpacity style={bp.option} onPress={onClose}>
            <Text style={[bp.optionText, { color: Colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const bp = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: '#000000A0',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md, paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  optionText: { fontSize: Font.md, fontWeight: '600', color: Colors.text },
  sep: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

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
  const [notes, setNotes] = useState('');

  // Date / time
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeObj, setTimeObj] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Location
  const [location, setLocation] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Banner
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [bannerPreviewUri, setBannerPreviewUri] = useState<string | null>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);

  const p1 = profilesMap.get(p1Id);
  const p2 = profilesMap.get(p2Id);

  const winnerId = p1Id && p2Id ? determineWinner(sets, p1Id, p2Id) : null;
  const canSave = p1Id && p2Id && p1Id !== p2Id && sets.some(s => s.p1 > 0 || s.p2 > 0);

  const handlePickProfile = (profile: Profile) => {
    if (pickerFor === 'p1') setP1Id(profile.id);
    else if (pickerFor === 'p2') setP2Id(profile.id);
    setPickerFor(null);
  };

  // ── Date/time handlers ──────────────────────────────────────────────────────

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDateObj(selected);
  };

  const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) setTimeObj(selected);
  };

  // ── Image picker helpers ────────────────────────────────────────────────────

  const setPickedBanner = (asset: ImagePicker.ImagePickerAsset) => {
    setBannerUri(asset.uri);
    setBannerPreviewUri(
      asset.base64
        ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
        : asset.uri
    );
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para escolher uma foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPickedBanner(result.assets[0]);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar uma foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPickedBanner(result.assets[0]);
    }
  };

  const handleBannerPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Banner da partida',
          options: ['Cancelar', 'Tirar foto', 'Escolher da galeria'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickFromCamera();
          if (idx === 2) pickFromGallery();
        }
      );
    } else {
      setShowBannerModal(true);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const dateStr = dateObj.toISOString().split('T')[0];
    const timeStr = timeObj
      ? timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : undefined;
    const match = await logMatch({
      date: dateStr,
      scheduledTime: timeStr,
      location: location.trim() || undefined,
      bannerUrl: bannerUri ?? undefined,
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

      {/* Quando */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quando</Text>
        <View style={styles.row2}>
          {/* Data */}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.fieldLabel}>Data</Text>
            <TouchableOpacity style={styles.inputBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.inputBtnText}>
                {dateObj.toLocaleDateString('pt-BR')}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Horário */}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.fieldLabel}>Horário</Text>
            <TouchableOpacity style={styles.inputBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={[styles.inputBtnText, !timeObj && styles.inputBtnPlaceholder]}>
                {timeObj
                  ? timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : 'HH:MM'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* iOS inline pickers */}
        {showDatePicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display="inline"
            onChange={onDateChange}
            locale="pt-BR"
            style={styles.inlinePicker}
          />
        )}
        {showTimePicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={timeObj ?? new Date()}
            mode="time"
            display="spinner"
            is24Hour
            onChange={onTimeChange}
            locale="pt-BR"
            style={styles.inlinePicker}
          />
        )}

        {/* Android — modal pickers (render outside conditionally) */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={timeObj ?? new Date()}
            mode="time"
            display="default"
            is24Hour
            onChange={onTimeChange}
          />
        )}
      </View>

      {/* Onde */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Onde</Text>
        <TouchableOpacity style={styles.inputBtn} onPress={() => setShowLocationModal(true)}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text
            style={[styles.inputBtnText, !location && styles.inputBtnPlaceholder]}
            numberOfLines={1}
          >
            {location || 'Clube, quadra, cidade…'}
          </Text>
          {location && (
            <TouchableOpacity onPress={() => setLocation('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banner (foto)</Text>
        <TouchableOpacity onPress={handleBannerPress}>
          {bannerPreviewUri ? (
            <View style={styles.bannerPreview}>
              <Image
                key={bannerPreviewUri}
                source={{ uri: bannerPreviewUri }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              <View style={styles.bannerEditPill}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.bannerChangeText}>Trocar foto</Text>
              </View>
            </View>
          ) : (
            <View style={styles.bannerEmpty}>
              <Ionicons name="camera-outline" size={28} color={Colors.textSecondary} />
              <Text style={styles.bannerEmptyText}>Tirar foto ou escolher da galeria</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notas */}
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

      {/* Modals */}
      <ProfilePickerModal
        visible={!!pickerFor}
        onClose={() => setPickerFor(null)}
        me={me}
        nearby={nearby}
        excludeId={pickerFor === 'p1' ? p2Id : p1Id}
        onPick={handlePickProfile}
      />

      <LocationModal
        visible={showLocationModal}
        initial={location}
        onClose={() => setShowLocationModal(false)}
        onSelect={setLocation}
      />

      <BannerPickerModal
        visible={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onPickGallery={pickFromGallery}
        onPickCamera={pickFromCamera}
      />
    </ScrollView>
  );
}

// ─── Profile picker modal ─────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.lg, paddingBottom: Spacing.lg },

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

  // Shared touch-button that looks like an input
  inputBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    minHeight: 48,
  },
  inputBtnText: { flex: 1, color: Colors.text, fontSize: Font.md },
  inputBtnPlaceholder: { color: Colors.textTertiary },

  // Plain text input (used for notes)
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { height: 100, textAlignVertical: 'top' },

  inlinePicker: { marginTop: Spacing.sm },

  // Banner
  bannerPreview: {
    height: 140, borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerEditPill: {
    position: 'absolute',
    right: Spacing.sm,
    bottom: Spacing.sm,
    backgroundColor: '#00000099',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    flexDirection: 'row',
  },
  bannerChangeText: { color: '#fff', fontWeight: '700', fontSize: Font.sm },
  bannerEmpty: {
    height: 100, borderRadius: Radius.lg,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  bannerEmptyText: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600' },

  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md, alignItems: 'center',
    marginHorizontal: Spacing.md, marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: Colors.bg, fontWeight: '900', fontSize: Font.md, letterSpacing: 1.5 },

  // Profile picker modal
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
  pickerAvatar: { width: 40, height: 40, borderRadius: 20 },
  pickerInitial: { fontSize: Font.md, fontWeight: '900', color: Colors.bg },
  pickerName: { fontSize: Font.md, fontWeight: '700', color: Colors.text },
  pickerHandle: { fontSize: Font.sm, color: Colors.textSecondary },
  rosterBadge: { backgroundColor: Colors.accent + '30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  rosterBadgeText: { fontSize: 10, fontWeight: '900', color: Colors.accent, letterSpacing: 0.5 },
  emptyPicker: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xxl },
  emptyPickerText: { fontSize: Font.sm, color: Colors.textSecondary },
});
