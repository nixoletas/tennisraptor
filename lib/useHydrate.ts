import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useMatchStore } from '../stores/useMatchStore';
import { useTournamentStore } from '../stores/useTournamentStore';

// Loads all owner-scoped data from Supabase whenever the session changes.
// Resets stores on sign-out so a different user doesn't see stale state.
export function useHydrate() {
  const { session } = useAuth();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      usePlayerStore.getState().reset();
      useMatchStore.getState().reset();
      useTournamentStore.getState().reset();
      return;
    }

    usePlayerStore.getState().loadAll(userId);
    useMatchStore.getState().loadAll(userId);
    useTournamentStore.getState().loadAll(userId);
  }, [userId]);
}
