import { create } from 'zustand';
import { Profile } from '../constants/types';
import { supabase } from '../lib/supabase';
import { profileFromRow, profilePatchToRow, ProfileRow } from '../lib/db';

interface ProfileStore {
  me: Profile | null;
  nearby: Profile[];
  loaded: boolean;

  loadMe: (userId: string) => Promise<void>;
  loadNearby: (userId: string) => Promise<void>;
  reset: () => void;

  updateMe: (patch: Partial<Profile>) => Promise<Profile | null>;
  completeOnboarding: (patch: Partial<Profile>) => Promise<Profile | null>;
}

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  me: null,
  nearby: [],
  loaded: false,

  loadMe: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[profile] loadMe', error);
      set({ loaded: true });
      return;
    }

    // Usuário sem profile (criado antes do trigger ou pós-reset do schema):
    // cria uma linha com os metadados disponíveis pra desbloquear onboarding.
    if (!data) {
      const { data: { user } } = await supabase.auth.getUser();
      const meta = user?.user_metadata ?? {};
      const name =
        meta.full_name ?? meta.name ?? (user?.email?.split('@')[0] ?? 'Jogador');
      const avatarUrl = meta.avatar_url ?? null;

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert({ id: userId, name, avatar_url: avatarUrl })
        .select('*')
        .single();

      if (insertErr) {
        console.error('[profile] auto-insert', insertErr);
        set({ loaded: true });
        return;
      }

      set({ me: profileFromRow(inserted as ProfileRow), loaded: true });
      return;
    }

    set({ me: profileFromRow(data as ProfileRow), loaded: true });
  },

  loadNearby: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('[profile] loadNearby', error);
      return;
    }

    set({ nearby: (data as ProfileRow[]).map(profileFromRow) });
  },

  reset: () => set({ me: null, nearby: [], loaded: false }),

  updateMe: async (patch) => {
    const me = get().me;
    if (!me) return null;

    const row = profilePatchToRow(patch);
    const { data, error } = await supabase
      .from('profiles')
      .update(row)
      .eq('id', me.id)
      .select('*')
      .single();

    if (error) {
      console.error('[profile] updateMe', error);
      return null;
    }

    const updated = profileFromRow(data as ProfileRow);
    set({ me: updated });
    return updated;
  },

  completeOnboarding: async (patch) => {
    return get().updateMe({ ...patch, onboardingCompleted: true });
  },
}));
