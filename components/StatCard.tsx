import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Font } from '../constants/theme';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  flex?: number;
}

export function StatCard({ label, value, sub, accent, flex }: Props) {
  return (
    <View style={[styles.card, flex !== undefined && { flex }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && styles.accentValue]}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  value: {
    fontSize: Font.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  accentValue: {
    color: Colors.accent,
  },
  sub: {
    fontSize: Font.xs,
    color: Colors.textTertiary,
  },
});
