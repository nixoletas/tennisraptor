import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Font, Spacing } from '../constants/theme';
import { Surface } from '../constants/types';

const SURFACE_THEMES: Record<Surface, {
  imageUri: string;
  fallbackColor: string;
  label: string;
  slam: string;
}> = {
  clay: {
    imageUri: 'https://wgefmfktuqztkuyhtigg.supabase.co/storage/v1/object/public/content/saibro.jpeg',
    fallbackColor: '#A0522D',
    label: 'Saibro',
    slam: 'Roland Garros',
  },
  hard: {
    // TODO: substituir pela URL da quadra dura quando disponível
    imageUri: 'https://wgefmfktuqztkuyhtigg.supabase.co/storage/v1/object/public/content/duro.jpeg',
    fallbackColor: '#1565C0',
    label: 'Duro',
    slam: 'US Open · ATP',
  },
  grass: {
    imageUri: 'https://wgefmfktuqztkuyhtigg.supabase.co/storage/v1/object/public/content/grama.jpeg',
    fallbackColor: '#2E7D32',
    label: 'Grama',
    slam: 'Wimbledon',
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
        { backgroundColor: theme.fallbackColor },
        style,
      ]}
      activeOpacity={0.85}
    >
      {/* Imagem de fundo opacity 40% */}
      <Image
        source={{ uri: theme.imageUri }}
        style={styles.bgImage}
        resizeMode="cover"
      />
      {/* Overlay escurece pra texto ficar legível */}
      <View style={styles.overlay} />

      <View style={[styles.content, compact && styles.contentCompact]}>
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
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000050',
  },
  content: {
    flex: 1, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  contentCompact: { padding: Spacing.sm, justifyContent: 'center' },
  label: { fontSize: Font.lg, fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  labelCompact: { fontSize: Font.md, textAlign: 'center' },
  slam: { fontSize: Font.xs, color: '#FFFFFFCC', fontWeight: '600', letterSpacing: 0.5 },
});
