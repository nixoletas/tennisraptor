import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Auto-detects environment:
// Expo Go  → exp://192.168.x.x:8081
// Standalone → tennisraptor://
const redirectTo = makeRedirectUri();

// Parses the redirect URL and creates a Supabase session.
// Supabase returns access_token + refresh_token directly in the URL
// when using a custom/exp:// scheme (implicit flow, not PKCE code).
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? '',
  });
  if (error) throw error;
  return data.session;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  redirectTo: string;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

  // Native deep-link listener: fired when the OS hands a URL back to the app
  // after Google OAuth (browser redirects to exp:// or tennisraptor://).
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Linking.addEventListener('url', ({ url }) => {
      createSessionFromUrl(url).catch(console.error);
    });

    // Cold-start: app opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) createSessionFromUrl(url).catch(console.error);
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      return;
    }

    console.log('[auth] redirectTo:', redirectTo); // add this to Supabase Redirect URLs

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

    if (Platform.OS === 'ios') {
      // iOS: ASWebAuthenticationSession intercepta o redirect automaticamente
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type === 'success') {
        await createSessionFromUrl(res.url);
      }
    } else {
      // Android: Chrome Custom Tabs pode não estar disponível.
      // Abre no browser padrão — quando Supabase redirecionar para exp://,
      // o Android dispara um Intent que reabre o Expo Go com a URL.
      // O Linking.addEventListener acima recebe a URL e cria a sessão.
      await Linking.openURL(data.url);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, redirectTo, signUp, signIn, signInWithGoogle, signOut }}
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
