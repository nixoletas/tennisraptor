import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useAuth } from '../../lib/AuthContext';

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // AuthContext listener handles redirect via _layout
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

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#1A2400', Colors.bg, Colors.bg]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.hero}>
            <Ionicons name="tennisball" size={56} color={Colors.accent} />
            <Text style={styles.title}>TennisRaptor</Text>
            <Text style={styles.subtitle}>Rastreie partidas. Domine adversários.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={16} color={Colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

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
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(v => !v)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => router.push('/auth/forgot')}>
                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, (!email || !password || loading) && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={!email || !password || loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.bg} />
                : <Text style={styles.primaryBtnText}>ENTRAR</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <>
                  <GoogleIcon />
                  <Text style={styles.googleBtnText}>Continuar com Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.footerLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function GoogleIcon() {
  return (
    <View style={styles.googleIcon}>
      <Text style={styles.googleIconText}>G</Text>
    </View>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
  if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.';
  if (msg.includes('Too many requests')) return 'Muitas tentativas. Aguarde um momento.';
  if (msg.includes('Network')) return 'Sem conexão. Verifique sua internet.';
  return msg;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradient: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing.xl, gap: Spacing.xl, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Font.xxxl, fontWeight: '900', color: Colors.text, letterSpacing: -1.5 },
  subtitle: { fontSize: Font.sm, color: Colors.textSecondary },
  form: { gap: Spacing.md },
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
  eyeBtn: {
    position: 'absolute', right: Spacing.md, top: 0, bottom: 0,
    justifyContent: 'center',
  },
  forgotText: { fontSize: Font.xs, color: Colors.accent, fontWeight: '600', textAlign: 'right', marginTop: 4 },
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
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: Font.sm, color: Colors.textSecondary },
  footerLink: { fontSize: Font.sm, color: Colors.accent, fontWeight: '700' },
});
