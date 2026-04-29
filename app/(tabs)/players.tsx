import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font, PLAY_STYLE_LABELS } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { Profile } from '../../constants/types';

export default function PlayersScreen() {
  const { getPlayerStats } = useMatchStore();
  const me = useProfileStore(s => s.me);
  const nearby = useProfileStore(s => s.nearby);

  const [search, setSearch] = useState('');

  const q = search.toLowerCase().trim();

  // Proximity ranking: same city > same state > others.
  const sortedNearby = useMemo(() => {
    const rank = (p: Profile) => {
      if (me?.regionCity && p.regionCity?.toLowerCase() === me.regionCity.toLowerCase()
          && p.regionState === me.regionState) return 0;
      if (me?.regionState && p.regionState === me.regionState) return 1;
      return 2;
    };
    return [...nearby].sort((a, b) => rank(a) - rank(b));
  }, [nearby, me?.regionState, me?.regionCity]);

  const filtered = sortedNearby.filter(p =>
    !q || p.name.toLowerCase().includes(q)
      || (p.handle ?? '').toLowerCase().includes(q)
      || (p.regionCity ?? '').toLowerCase().includes(q)
  );

  const sameCityCount = me?.regionCity
    ? sortedNearby.filter(p =>
        p.regionCity?.toLowerCase() === me.regionCity?.toLowerCase()
        && p.regionState === me.regionState
      ).length
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nome, @handle ou cidade…"
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {me && (
        <View style={styles.regionBanner}>
          <Ionicons name="navigate" size={14} color={Colors.accent} />
          <Text style={styles.regionText}>
            Perto de você: {me.regionCity ?? '—'}{me.regionState ? `, ${me.regionState}` : ''}
            {sameCityCount > 0 && ` · ${sameCityCount} na sua cidade`}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Ninguém perto ainda</Text>
            <Text style={styles.emptyText}>
              Convide amigos pra TennisRaptor e construa sua rivalidade local.
            </Text>
          </View>
        ) : (
          filtered.map(p => {
            const sameCity = me?.regionCity
              && p.regionCity?.toLowerCase() === me.regionCity.toLowerCase()
              && p.regionState === me.regionState;
            const sameState = !sameCity && me?.regionState && p.regionState === me.regionState;
            const stats = getPlayerStats(p.id);
            const total = stats.wins + stats.losses;
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.profileRow}
                onPress={() => router.push(`/player/${p.id}` as any)}
              >
                {p.avatarUrl ? (
                  <Image source={{ uri: p.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: p.avatarColor ?? Colors.blue, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={styles.avatarText}>{p.name[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{p.name}</Text>
                  {p.handle && <Text style={styles.profileHandle}>@{p.handle}</Text>}
                  <View style={styles.profileMeta}>
                    {sameCity && <Badge label="Mesma cidade" tone="accent" />}
                    {sameState && <Badge label={p.regionState ?? ''} tone="muted" />}
                    {!sameCity && !sameState && p.regionState && <Badge label={p.regionState} tone="muted" />}
                    {p.playStyle && <Badge label={PLAY_STYLE_LABELS[p.playStyle]} tone="muted" />}
                    {total > 0 && <Badge label={`${stats.wins}V ${stats.losses}D`} tone="muted" />}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
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
  searchRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 44,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: Font.md },

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
  profileHandle: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: -2 },
  profileMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  badgeAccent: { backgroundColor: Colors.accent + '25' },
  badgeMuted: { backgroundColor: Colors.border },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3 },
  badgeTextAccent: { color: Colors.accent },
});
