import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { useHydrate } from '../lib/useHydrate';
import { useProfileStore } from '../stores/useProfileStore';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const profileLoaded = useProfileStore(s => s.loaded);
  const me = useProfileStore(s => s.me);
  const segments = useSegments();
  const router = useRouter();

  useHydrate();

  useEffect(() => {
    if (authLoading) return;

    // Sem sessão → login (e esconde splash imediatamente).
    if (!session) {
      SplashScreen.hideAsync();
      const inAuth = segments[0] === 'auth';
      if (!inAuth) router.replace('/auth/login');
      return;
    }

    // Com sessão: precisa profile carregado pra decidir onboarding.
    if (!profileLoaded) return;

    SplashScreen.hideAsync();

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const needsOnboarding = !me?.onboardingCompleted;

    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (!needsOnboarding && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading, profileLoaded, me?.onboardingCompleted, segments]);

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
            <Stack.Screen name="history" options={{ title: 'Histórico' }} />
            <Stack.Screen name="about" options={{ title: 'Sobre' }} />
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
