import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { createSessionFromUrl } from '../../lib/AuthContext';
import { Colors } from '../../constants/theme';

// This page is reached in two ways:
// 1. Web: browser is redirected here by Supabase after Google OAuth
// 2. Native: Expo Router maps the exp:// deep link path here
//    (the Linking listener in AuthContext already handles native — just show spinner)
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Native session is handled by the Linking listener in AuthContext.
      // Nothing to do here — AuthGate will redirect once session is set.
      return;
    }

    // Web: read URL from browser and create session
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    createSessionFromUrl(url)
      .then(() => router.replace('/(tabs)'))
      .catch(err => {
        console.error('[auth/callback] error:', err);
        router.replace('/auth/login');
      });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
});
