import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Handles the URL returned by Supabase after OAuth completes.
// Works for both PKCE (code=...) and implicit (#access_token=...).
async function handleAuthCallback(url: string) {
  // PKCE flow: ?code=xxx
  if (url.includes('code=')) {
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    if (error) console.error('[auth] exchangeCodeForSession:', error.message);
    return;
  }

  // Implicit flow: #access_token=xxx&refresh_token=yyy
  const fragment = url.split('#')[1] ?? '';
  const params = Object.fromEntries(new URLSearchParams(fragment));
  if (params.access_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token ?? '',
    });
    if (error) console.error('[auth] setSession:', error.message);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Deep-link listener — catches the OAuth redirect on native (both Expo Go and standalone)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Linking.addEventListener('url', ({ url }) => {
      const prefix = Linking.createURL('/');
      if (url.startsWith(prefix)) {
        WebBrowser.dismissBrowser();
        handleAuthCallback(url);
      }
    });

    Linking.getInitialURL().then(url => {
      if (url) handleAuthCallback(url);
    });

    return () => sub.remove();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === 'web') {
      // Web: Supabase redirects the current tab after Google auth.
      // The /auth/callback page (or _layout listener) picks up the session.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return;
    }

    // Native: use the deep-link URL for this environment.
    // Expo Go  →  exp://192.168.x.x:8081/--/auth/callback
    // Standalone → tennisraptor://auth/callback
    const redirectTo = Linking.createURL('/auth/callback');
    console.log('[auth] redirectTo:', redirectTo); // paste this in Supabase Redirect URLs if it's missing

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
      showInRecents: false,
    });

    // iOS: result.type === 'success' with the full callback URL
    if (result.type === 'success' && result.url) {
      await handleAuthCallback(result.url);
    }
    // Android: the Linking listener above handles it (result.type === 'dismiss')
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signUp, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
