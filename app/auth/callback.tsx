import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/theme';

// Web-only: Supabase redirects to /auth/callback after Google OAuth.
// This page exchanges the code for a session and redirects to the app.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    const exchange = async () => {
      if (url.includes('code=')) {
        await supabase.auth.exchangeCodeForSession(url);
      } else if (url.includes('access_token=')) {
        const hash = url.split('#')[1] ?? '';
        const params = Object.fromEntries(new URLSearchParams(hash));
        if (params.access_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token ?? '',
          });
        }
      }
      router.replace('/(tabs)');
    };

    exchange().catch(console.error);
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
