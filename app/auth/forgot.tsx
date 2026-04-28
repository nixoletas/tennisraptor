import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ForgotScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'tennisraptor://auth/reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Recuperar Senha</Text>
        <Text style={styles.subtitle}>
          Informe seu email e enviaremos um link para redefinir sua senha.
        </Text>

        {sent ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentIcon}>📬</Text>
            <Text style={styles.sentTitle}>Email enviado!</Text>
            <Text style={styles.sentText}>Verifique sua caixa de entrada em{'\n'}<Text style={styles.sentEmail}>{email}</Text></Text>
          </View>
        ) : (
          <>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={16} color={Colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />

            <TouchableOpacity
              style={[styles.btn, (!email || loading) && styles.btnDisabled]}
              onPress={handleReset}
              disabled={!email || loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.bg} />
                : <Text style={styles.btnText}>ENVIAR LINK</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, padding: Spacing.xl, gap: Spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  backText: { fontSize: Font.md, color: Colors.text, fontWeight: '600' },
  title: { fontSize: Font.xxxl, fontWeight: '900', color: Colors.text, letterSpacing: -1 },
  subtitle: { fontSize: Font.sm, color: Colors.textSecondary, lineHeight: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.red + '20', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.red + '40',
  },
  errorText: { flex: 1, fontSize: Font.sm, color: Colors.red },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  btn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: Colors.bg, fontWeight: '900', fontSize: Font.md, letterSpacing: 1 },
  sentBox: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  sentIcon: { fontSize: 64 },
  sentTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  sentText: { fontSize: Font.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  sentEmail: { color: Colors.accent, fontWeight: '700' },
});
