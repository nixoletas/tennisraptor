import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Font } from '../constants/theme';
import { MatchSet, Surface } from '../constants/types';

interface Props {
  sets: MatchSet[];
  onChange: (sets: MatchSet[]) => void;
  maxSets?: number;
  surface?: Surface;
  p1Name?: string;
  p2Name?: string;
  onPressP1?: () => void;
  onPressP2?: () => void;
}

const SCOREBOARD_THEMES: Record<Surface, {
  boardBg: string;
  rowBg: string;
  rowBgAlt: string;
  nameText: string;
  namePlaceholder: string;
  cellBg: string;
  cellText: string;
  activeCellBg: string;
  activeCellText: string;
  headerBg: string;
  headerText: string;
  addBtnColor: string;
  border: string;
  divider: string;
}> = {
  clay: {
    boardBg: '#214732',
    rowBg: '#214732',
    rowBgAlt: '#214732',
    namePlaceholder: '#FFFFFF99',
    nameText: '#FFFFFF',
    cellBg: '#214732',
    cellText: '#669470',
    activeCellBg: '#214732',
    activeCellText: '#FFFFFF',
    headerBg: '#215732',
    headerText: '#FFFFFF',
    addBtnColor: '#FFFFFF',
    border: '#214732',
    divider: '#1a3d28',
  },
  // Wimbledon: verde escuro + roxo, células brancas (look icônico)
  grass: {
    boardBg: '#0D1F0D',
    rowBg: '#122112',
    rowBgAlt: '#183018',
    namePlaceholder: '#FFFFFF99',
    nameText: '#FFFFFF',
    cellBg: '#122112',
    cellText: '#FFFFFF',
    activeCellBg: '#4E007B',
    activeCellText: '#FFFFFF',
    headerBg: '#0A180A',
    headerText: '#A5D6A7',
    addBtnColor: '#FFFFFF',
    border: '#4A148C40',
    divider: '#0A160A',
  },
  // US Open / ATP: azul marinho, células cinza-azuladas
  hard: {
    boardBg: '#080F2A',
    rowBg: '#0D1B4B',
    rowBgAlt: '#112060',
    namePlaceholder: '#FFFFFF99',
    nameText: '#FFFFFF',
    cellBg: '#1E2F6A',
    cellText: '#FFFFFF',
    activeCellBg: '#4FC3F7',
    activeCellText: '#080F2A',
    headerBg: '#060C1F',
    headerText: '#4FC3F7',
    addBtnColor: '#4FC3F7',
    border: '#4FC3F740',
    divider: '#060C1F',
  },
};

function ScoreCell({
  value, onChange, cellBg, cellText,
}: {
  value: number; onChange: (v: number) => void; cellBg: string; cellText: string;
}) {
  const handleChange = (text: string) => {
    if (text === '') { onChange(0); return; }
    const n = parseInt(text, 10);
    if (!isNaN(n) && n >= 0 && n <= 99) onChange(n);
  };

  return (
    <TextInput
      style={[styles.cell, { backgroundColor: cellBg, color: cellText }]}
      value={value === 0 ? '' : String(value)}
      onChangeText={handleChange}
      keyboardType="number-pad"
      maxLength={2}
      placeholder="0"
      placeholderTextColor={cellText + '50'}
      selectTextOnFocus
      textAlign="center"
    />
  );
}

function NameCell({
  name, onPress, rowBg, nameText, namePlaceholder,
}: {
  name?: string; onPress?: () => void;
  rowBg: string; nameText: string; namePlaceholder: string;
}) {
  const selected = !!name;
  return (
    <TouchableOpacity
      style={[styles.nameCol, { backgroundColor: rowBg }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {selected ? (
        <Text style={[styles.playerName, { color: nameText }]} numberOfLines={1}>
          {name}
        </Text>
      ) : (
        <View style={styles.namePlaceholderRow}>
          <Ionicons name="person-add-outline" size={14} color="white" />
          <Text style={[styles.namePlaceholderText, { color: 'white' }]}>
            Selecionar
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function SetScoreInput({
  sets, onChange, maxSets = 3, surface = 'hard',
  p1Name, p2Name, onPressP1, onPressP2,
}: Props) {
  const t = SCOREBOARD_THEMES[surface];

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

  const setWinner = (s: MatchSet): 'p1' | 'p2' | null => {
    if (s.p1 > s.p2) return 'p1';
    if (s.p2 > s.p1) return 'p2';
    return null;
  };

  return (
    <View style={[styles.board, { backgroundColor: t.boardBg, borderColor: t.border }]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: t.headerBg }]}>
        <View style={styles.nameCol} />
        {sets.map((_, i) => (
          <View key={i} style={styles.setHeaderCell}>
            <Text style={[styles.setHeaderText, { color: t.headerText }]}>S{i + 1}</Text>
            {sets.length > 1 && (
              <TouchableOpacity onPress={() => removeSet(i)} hitSlop={8}>
                <Text style={[styles.removeX, { color: t.headerText + '99' }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {sets.length < maxSets ? (
          <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
            <Text style={[styles.addSetText, { color: t.addBtnColor }]}>+S</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addSetBtn} />
        )}
      </View>

      {/* P1 row */}
      <View style={[styles.playerRow, { backgroundColor: t.rowBg }]}>
        <NameCell
          name={p1Name}
          onPress={onPressP1}
          rowBg={t.rowBg}
          nameText={t.nameText}
          namePlaceholder={t.namePlaceholder}
        />
        {sets.map((s, i) => {
          const won = setWinner(s) === 'p1';
          return (
            <ScoreCell
              key={i}
              value={s.p1}
              onChange={(v: number) => update(i, 'p1', v)}
              cellBg={won ? t.activeCellBg : t.cellBg}
              cellText={won ? t.activeCellText : t.cellText}
            />
          );
        })}
        <View style={styles.addSetBtn} />
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: t.divider }]} />

      {/* P2 row */}
      <View style={[styles.playerRow, { backgroundColor: t.rowBgAlt }]}>
        <NameCell
          name={p2Name}
          onPress={onPressP2}
          rowBg={t.rowBgAlt}
          nameText={t.nameText}
          namePlaceholder={t.namePlaceholder}
        />
        {sets.map((s, i) => {
          const won = setWinner(s) === 'p2';
          return (
            <ScoreCell
              key={i}
              value={s.p2}
              onChange={(v: number) => update(i, 'p2', v)}
              cellBg={won ? t.activeCellBg : t.cellBg}
              cellText={won ? t.activeCellText : t.cellText}
            />
          );
        })}
        <View style={styles.addSetBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.xs,
  },
  divider: { height: 1 },
  nameCol: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    justifyContent: 'center',
    minHeight: 48,
  },
  playerName: {
    fontSize: Font.sm,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  namePlaceholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  namePlaceholderText: {
    fontSize: Font.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  setHeaderCell: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    paddingVertical: 4,
  },
  setHeaderText: {
    fontSize: Font.xs,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  removeX: { fontSize: 9, fontWeight: '700' },
  cell: {
    width: 52,
    height: 44,
    borderRadius: Radius.sm,
    fontSize: Font.xl,
    fontWeight: '900',
  },
  addSetBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetText: {
    fontSize: Font.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
