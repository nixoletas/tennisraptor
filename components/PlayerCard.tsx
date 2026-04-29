import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors, Radius, Spacing, Font } from '../constants/theme';
import { Profile } from '../constants/types';

interface Props {
  profile: Profile;
  isMe?: boolean;
  onPress?: () => void;
  wins?: number;
  losses?: number;
  subtitle?: string;
  right?: React.ReactNode;
}

export function PlayerCard({ profile, isMe, onPress, wins, losses, subtitle, right }: Props) {
  const total = (wins ?? 0) + (losses ?? 0);
  const wr = total > 0 ? Math.round(((wins ?? 0) / total) * 100) : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {profile.avatarUrl ? (
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: profile.avatarColor ?? Colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={styles.avatarText}>{profile.name[0]?.toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          {isMe && <View style={styles.meBadge}><Text style={styles.meBadgeText}>eu</Text></View>}
        </View>
        {profile.handle && <Text style={styles.handle}>@{profile.handle}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {wins !== undefined && (
          <Text style={styles.subtitle}>
            {wins}V {losses}D{wr !== null ? ` · ${wr}%` : ''}
          </Text>
        )}
      </View>

      {right}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: Font.lg, fontWeight: '800', color: Colors.bg },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  name: { fontSize: Font.md, fontWeight: '700', color: Colors.text },
  handle: { fontSize: Font.sm, color: Colors.textSecondary },
  meBadge: {
    backgroundColor: Colors.accent + '30',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.full,
  },
  meBadgeText: { fontSize: Font.xs, color: Colors.accent, fontWeight: '700' },
  subtitle: { fontSize: Font.sm, color: Colors.textSecondary },
});
