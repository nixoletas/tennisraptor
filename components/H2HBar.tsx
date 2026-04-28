import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Font } from '../constants/theme';

interface Props {
  p1Name: string;
  p2Name: string;
  p1Value: number;
  p2Value: number;
  label?: string;
  unit?: string;
}

export function H2HBar({ p1Name, p2Name, p1Value, p2Value, label, unit = '' }: Props) {
  const total = p1Value + p2Value;
  const p1Pct = total === 0 ? 0.5 : p1Value / total;
  const p1Wins = p1Value > p2Value;
  const p2Wins = p2Value > p1Value;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <Text style={[styles.value, p1Wins && styles.accentValue]}>{p1Value}{unit}</Text>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { flex: p1Pct, backgroundColor: p1Wins ? Colors.accent : Colors.surface }]} />
          <View style={[styles.barFill, { flex: 1 - p1Pct, backgroundColor: p2Wins ? Colors.blue : Colors.surface }]} />
        </View>
        <Text style={[styles.value, styles.right, p2Wins && styles.blueValue]}>{p2Value}{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barContainer: {
    flex: 1,
    height: 6,
    borderRadius: Radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  value: {
    fontSize: Font.lg,
    fontWeight: '800',
    color: Colors.textSecondary,
    minWidth: 32,
  },
  right: {
    textAlign: 'right',
  },
  accentValue: {
    color: Colors.accent,
  },
  blueValue: {
    color: Colors.blue,
  },
});
