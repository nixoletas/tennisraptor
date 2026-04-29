import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { useHydrate } from '../lib/useHydrate';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useHydrate();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();

    const inAuth = segments[0] === 'auth';

    if (!session && !inAuth) {
      router.replace('/auth/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <AuthProvider>
        <AuthGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#0D0D0D' },
              headerTintColor: '#FFFFFF',
              headerShadowVisible: false,
              contentStyle: { backgroundColor: '#0D0D0D' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="match/new" options={{ title: 'Registrar Partida', presentation: 'modal' }} />
            <Stack.Screen name="match/live" options={{ title: 'Ao Vivo', headerBackVisible: false }} />
            <Stack.Screen name="match/[id]" options={{ title: 'Partida' }} />
            <Stack.Screen name="player/[id]" options={{ title: 'Jogador' }} />
            <Stack.Screen name="tournament/new" options={{ title: 'Novo Torneio', presentation: 'modal' }} />
            <Stack.Screen name="tournament/[id]" options={{ title: 'Torneio' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
