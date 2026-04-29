import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useMatchStore } from '../stores/useMatchStore';
import { useProfileStore } from '../stores/useProfileStore';

// Loads all owner-scoped data from Supabase whenever the session changes.
// Resets stores on sign-out so a different user doesn't see stale state.
export function useHydrate() {
  const { session } = useAuth();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      useProfileStore.getState().reset();
      useMatchStore.getState().reset();
      return;
    }

    useProfileStore.getState().loadMe(userId);
    useProfileStore.getState().loadNearby(userId);
    useMatchStore.getState().loadAll(userId);
  }, [userId]);
}
