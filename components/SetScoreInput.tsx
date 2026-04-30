import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Font } from '../constants/theme';
import { MatchSet, Surface } from '../constants/types';

interface Props {
  sets: MatchSet[];
  onChange: (sets: MatchSet[]) => void;
  maxSets?: number;
  surface?: Surface;
  p1Name?: string;
  p2Name?: string;
}

// Temas visuais por superfície — inspirados nos placarões reais.
const SCOREBOARD_THEMES: Record<Surface, {
  boardBg: string;
  rowBg: string;
  rowBgAlt: string;
  nameText: string;
  nameBg: string;
  cellBg: string;
  cellText: string;
  activeCellBg: string;
  activeCellText: string;
  headerBg: string;
  headerText: string;
  addBtnColor: string;
  border: string;
}> = {
  // Roland Garros: fundo terracota escuro, verde floresta, placar em branco
  clay: {
    boardBg: '#214732',
    rowBg: '#214732',
    rowBgAlt: '#214732',
    nameBg: '#214732',
    nameText: '#FFFFFF',
    cellBg: '#214732',
    cellText: '#669470',
    activeCellBg: '#214732',
    activeCellText: '#FFFFFF',
    headerBg: '#215732',
    headerText: '#FFFFFF',
    addBtnColor: '#FFFFFF',
    border: '#214732',
  },
  // Wimbledon: verde escuro + roxo, células brancas (look icônico)
  grass: {
    boardBg: '#0D1F0D',
    rowBg: '#122112',
    rowBgAlt: '#183018',
    nameBg: '#122112',
    nameText: '#FFFFFF',
    cellBg: '#122112',
    cellText: '#FFFFFF',
    activeCellBg: '#4E007B',
    activeCellText: '#FFFFFF',
    headerBg: '#0A180A',
    headerText: '#A5D6A7',
    addBtnColor: '#FFFFFF',
    border: '#4A148C40',
  },
  // US Open / ATP: azul marinho, células cinza-azuladas
  hard: {
    boardBg: '#080F2A',
    rowBg: '#0D1B4B',
    rowBgAlt: '#112060',
    nameBg: '#0D1B4B',
    nameText: '#FFFFFF',
    cellBg: '#1E2F6A',
    cellText: '#FFFFFF',
    activeCellBg: '#4FC3F7',
    activeCellText: '#080F2A',
    headerBg: '#060C1F',
    headerText: '#4FC3F7',
    addBtnColor: '#4FC3F7',
    border: '#4FC3F740',
  },
};

function ScoreCell({
  value,
  onChange,
  cellBg,
  cellText,
}: {
  value: number;
  onChange: (v: number) => void;
  cellBg: string;
  cellText: string;
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
      placeholderTextColor={cellText + '60'}
      selectTextOnFocus
      textAlign="center"
    />
  );
}

export function SetScoreInput({ sets, onChange, maxSets = 3, surface = 'hard', p1Name, p2Name }: Props) {
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

  // Detecta set vencedor por jogador
  const setWinner = (s: MatchSet): 'p1' | 'p2' | null => {
    if (s.p1 > s.p2) return 'p1';
    if (s.p2 > s.p1) return 'p2';
    return null;
  };

  return (
    <View style={[styles.board, { backgroundColor: t.boardBg, borderColor: t.border }]}>
      {/* Header: SET 1 / SET 2 / SET 3 */}
      <View style={[styles.headerRow, { backgroundColor: t.headerBg }]}>
        <View style={styles.nameCol} />
        {sets.map((_, i) => (
          <View key={i} style={styles.setHeaderCell}>
            <Text style={[styles.setHeaderText, { color: t.headerText }]}>S{i + 1}</Text>
            {sets.length > 1 && (
              <TouchableOpacity onPress={() => removeSet(i)} hitSlop={8}>
                <Text style={[styles.removeX, { color: t.headerText + 'AA' }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {sets.length < maxSets && (
          <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
            <Text style={[styles.addSetText, { color: t.addBtnColor }]}>+S</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* P1 row */}
      <View style={[styles.playerRow, { backgroundColor: t.rowBg }]}>
        <View style={[styles.nameCol, { backgroundColor: t.nameBg }]}>
          <Text style={[styles.playerName, { color: t.nameText }]} numberOfLines={1}>
            {p1Name ?? 'P1'}
          </Text>
        </View>
        {sets.map((s, i) => {
          const won = setWinner(s) === 'p1';
          return (
            <ScoreCell
              key={i}
              value={s.p1}
              onChange={v => update(i, 'p1', v)}
              cellBg={won ? t.activeCellBg : t.cellBg}
              cellText={won ? t.activeCellText : t.cellText}
            />
          );
        })}
        {sets.length < maxSets && <View style={styles.addSetBtn} />}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: t.border }]} />

      {/* P2 row */}
      <View style={[styles.playerRow, { backgroundColor: t.rowBgAlt }]}>
        <View style={[styles.nameCol, { backgroundColor: t.rowBgAlt }]}>
          <Text style={[styles.playerName, { color: t.nameText }]} numberOfLines={1}>
            {p2Name ?? 'P2'}
          </Text>
        </View>
        {sets.map((s, i) => {
          const won = setWinner(s) === 'p2';
          return (
            <ScoreCell
              key={i}
              value={s.p2}
              onChange={v => update(i, 'p2', v)}
              cellBg={won ? t.activeCellBg : t.cellBg}
              cellText={won ? t.activeCellText : t.cellText}
            />
          );
        })}
        {sets.length < maxSets && <View style={styles.addSetBtn} />}
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

  divider: {
    height: 1,
  },

  nameCol: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  playerName: {
    fontSize: Font.sm,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  removeX: {
    fontSize: 9,
    fontWeight: '700',
  },

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
