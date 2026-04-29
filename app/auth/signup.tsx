import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useAuth } from '../../lib/AuthContext';

export default function SignupScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = name.trim().length >= 2 && email.includes('@') && password.length >= 6;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      setSuccess(true);
    } catch (e: any) {
      setError(translateError(e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(translateError(e.message));
    } finally {
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="mail-unread-outline" size={64} color={Colors.accent} />
        <Text style={styles.successTitle}>Verifique seu email</Text>
        <Text style={styles.successText}>
          Enviamos um link de confirmação para{'\n'}
          <Text style={styles.successEmail}>{email}</Text>
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar para Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
          <Text style={styles.backText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Comece a rastrear suas partidas agora.</Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={16} color={Colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Seu nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Rafael Nadal"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="mínimo 6 caracteres"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {password.length > 0 && password.length < 6 && (
            <Text style={styles.hintText}>Mínimo de 6 caracteres</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
          onPress={handleSignUp}
          disabled={!canSubmit || loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.bg} />
            : <Text style={styles.primaryBtnText}>CRIAR CONTA</Text>
          }
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
          onPress={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <>
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Continuar com Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function translateError(msg: string): string {
  if (msg.includes('already registered')) return 'Email já cadastrado. Tente fazer login.';
  if (msg.includes('Password should')) return 'Senha muito curta (mínimo 6 caracteres).';
  if (msg.includes('invalid email')) return 'Email inválido.';
  if (msg.includes('Network')) return 'Sem conexão. Verifique sua internet.';
  return msg;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, padding: Spacing.xl, gap: Spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  backText: { fontSize: Font.md, color: Colors.text, fontWeight: '600' },
  title: { fontSize: Font.xxxl, fontWeight: '900', color: Colors.text, letterSpacing: -1 },
  subtitle: { fontSize: Font.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.red + '20', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.red + '40',
  },
  errorText: { flex: 1, fontSize: Font.sm, color: Colors.red },
  field: { gap: 6 },
  label: { fontSize: Font.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: Spacing.md, top: 0, bottom: 0, justifyContent: 'center' },
  hintText: { fontSize: Font.xs, color: Colors.orange },
  primaryBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.xs,
  },
  btnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: Colors.bg, fontWeight: '900', fontSize: Font.md, letterSpacing: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Font.xs, color: Colors.textTertiary, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  googleBtnText: { fontSize: Font.md, color: Colors.text, fontWeight: '700' },
  googleIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center',
  },
  googleIconText: { color: '#fff', fontWeight: '900', fontSize: Font.sm },
  successContainer: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.lg,
  },
  successTitle: { fontSize: Font.xxl, fontWeight: '900', color: Colors.text },
  successText: { fontSize: Font.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  successEmail: { color: Colors.accent, fontWeight: '700' },
  backBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  backBtnText: { color: Colors.bg, fontWeight: '800', fontSize: Font.md },
});
