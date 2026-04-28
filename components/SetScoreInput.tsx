import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Font } from '../constants/theme';
import { MatchSet } from '../constants/types';

interface Props {
  sets: MatchSet[];
  onChange: (sets: MatchSet[]) => void;
  maxSets?: number;
}

function ScoreButton({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.scoreControl}>
      <TouchableOpacity onPress={() => onChange(Math.max(0, value - 1))} style={styles.btn}>
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.scoreValue}>{value}</Text>
      <TouchableOpacity onPress={() => onChange(value + 1)} style={styles.btn}>
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SetScoreInput({ sets, onChange, maxSets = 3 }: Props) {
  const update = (i: number, key: 'p1' | 'p2', v: number) => {
    const next = [...sets];
    next[i] = { ...next[i], [key]: v };
    onChange(next);
  };

  const addSet = () => {
    if (sets.length < maxSets) onChange([...sets, { p1: 0, p2: 0 }]);
  };

  const removeSet = (i: number) => {
    onChange(sets.filter((_, idx) => idx !== i));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.colLabel}>P1</Text>
        <Text style={styles.colLabel}>P2</Text>
      </View>

      {sets.map((s, i) => (
        <View key={i} style={styles.setRow}>
          <Text style={styles.setLabel}>SET {i + 1}</Text>
          <ScoreButton value={s.p1} onChange={v => update(i, 'p1', v)} />
          <Text style={styles.dash}>—</Text>
          <ScoreButton value={s.p2} onChange={v => update(i, 'p2', v)} />
          <TouchableOpacity onPress={() => removeSet(i)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {sets.length < maxSets && (
        <TouchableOpacity style={styles.addBtn} onPress={addSet}>
          <Text style={styles.addBtnText}>+ SET</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.xl,
    paddingRight: 32,
  },
  colLabel: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
    width: 80,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  setLabel: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    width: 40,
    letterSpacing: 0.5,
  },
  scoreControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: Font.lg,
    color: Colors.text,
    fontWeight: '700',
  },
  scoreValue: {
    fontSize: Font.xl,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  dash: {
    fontSize: Font.md,
    color: Colors.textTertiary,
  },
  removeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: Font.xs,
    color: Colors.textTertiary,
  },
  addBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
