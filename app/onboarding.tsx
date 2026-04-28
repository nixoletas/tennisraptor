import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const { setupMe } = usePlayerStore();

  const handleStart = () => {
    if (!name.trim()) return;
    setupMe(name.trim(), handle.trim() || undefined);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#1A2400', Colors.bg, Colors.bg]} style={styles.gradient}>
        <View style={styles.hero}>
          <Text style={styles.logo}>🎾</Text>
          <Text style={styles.title}>TennisRaptor</Text>
          <Text style={styles.subtitle}>Rastreie partidas, compare stats{'\n'}e domine seus adversários.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Quem é você?</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="@handle (opcional)"
            placeholderTextColor={Colors.textTertiary}
            value={handle}
            onChangeText={setHandle}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />

          <TouchableOpacity
            style={[styles.startBtn, !name.trim() && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!name.trim()}
          >
            <Text style={styles.startBtnText}>COMEÇAR A JOGAR</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>Seus dados ficam apenas no dispositivo.</Text>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between', paddingVertical: Spacing.xxl * 2 },
  hero: { alignItems: 'center', gap: Spacing.md },
  logo: { fontSize: 80 },
  title: { fontSize: Font.display, fontWeight: '900', color: Colors.text, letterSpacing: -2 },
  subtitle: { fontSize: Font.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  form: { gap: Spacing.md },
  formTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  startBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { color: Colors.bg, fontWeight: '900', fontSize: Font.md, letterSpacing: 1.5 },
  note: { fontSize: Font.xs, color: Colors.textTertiary, textAlign: 'center' },
});
