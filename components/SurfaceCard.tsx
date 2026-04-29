import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Font, Spacing } from '../constants/theme';
import { Surface } from '../constants/types';

// Tematização inspirada nos Slams:
// Saibro = Roland Garros (laranja terracota), Duro = US Open (azul profundo),
// Grama = Wimbledon (verde + roxo).
const SURFACE_THEMES: Record<Surface, {
  gradient: readonly [string, string, ...string[]];
  label: string;
  slam: string;
  icon: keyof typeof Ionicons.glyphMap;
  ballColor: string;
}> = {
  clay: {
    gradient: ['#D2691E', '#A0522D', '#8B4513'] as const,
    label: 'Saibro',
    slam: 'Roland Garros',
    icon: 'leaf',
    ballColor: '#FFE57F',
  },
  hard: {
    gradient: ['#0A4D8C', '#1565C0', '#42A5F5'] as const,
    label: 'Duro',
    slam: 'US Open · ATP',
    icon: 'square',
    ballColor: '#D4FF00',
  },
  grass: {
    gradient: ['#4A148C', '#2E7D32', '#66BB6A'] as const,
    label: 'Grama',
    slam: 'Wimbledon',
    icon: 'flower',
    ballColor: '#FFFFFF',
  },
};

export function getSurfaceTheme(surface: Surface) {
  return SURFACE_THEMES[surface];
}

interface SurfaceCardProps {
  surface: Surface;
  selected: boolean;
  onPress: () => void;
  variant?: 'tile' | 'compact';
  style?: ViewStyle;
}

export function SurfaceCard({ surface, selected, onPress, variant = 'tile', style }: SurfaceCardProps) {
  const theme = SURFACE_THEMES[surface];
  const compact = variant === 'compact';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        compact && styles.cardCompact,
        selected && styles.cardSelected,
        style,
      ]}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Overlay escurece pra texto ficar legível */}
      <View style={styles.overlay} />

      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={styles.iconWrap}>
          <Ionicons name={theme.icon} size={compact ? 18 : 24} color={theme.ballColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, compact && styles.labelCompact]}>{theme.label}</Text>
          {!compact && <Text style={styles.slam}>{theme.slam}</Text>}
        </View>
        {selected && (
          <Ionicons name="checkmark-circle" size={compact ? 18 : 22} color={Colors.text} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 84,
  },
  cardCompact: { minHeight: 56 },
  cardSelected: { borderColor: Colors.accent },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000038',
  },
  content: {
    flex: 1, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  contentCompact: { padding: Spacing.sm },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFFF20',
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: Font.lg, fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  labelCompact: { fontSize: Font.md },
  slam: { fontSize: Font.xs, color: '#FFFFFFCC', fontWeight: '600', letterSpacing: 0.5 },
});
