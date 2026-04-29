import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Font } from '../constants/theme';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="tennisball" size={56} color={Colors.accent} />
        <Text style={styles.title}>TennisRaptor</Text>
        <Text style={styles.tagline}>
          Ladder social de tênis.{'\n'}Rivalidades, ranking, narrativa.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Versão</Text>
        <Text style={styles.text}>1.0.0 (beta)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stack</Text>
        <Text style={styles.text}>Expo · React Native · Supabase · Zustand</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  title: { fontSize: Font.xxxl, fontWeight: '900', color: Colors.text, letterSpacing: -1 },
  tagline: { fontSize: Font.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  section: { gap: Spacing.xs },
  sectionTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  text: { fontSize: Font.md, color: Colors.text },
});
