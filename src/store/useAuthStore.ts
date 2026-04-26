import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  userKeys: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
    pollinations?: string;
  };
  updateUserKeys: (keys: Partial<AuthState['userKeys']>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  userKeys: {},
  updateUserKeys: (newKeys) => set((state) => ({ 
    userKeys: { ...state.userKeys, ...newKeys } 
  })),
  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, gemini_key, openai_key, anthropic_key, pollinations_key')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn("Perfil não encontrado ou erro:", error);
        return;
      }
      
      if (data) {
        set({ 
          isAdmin: !!data.is_admin,
          userKeys: {
            gemini: data.gemini_key,
            openai: data.openai_key,
            anthropic: data.anthropic_key,
            pollinations: data.pollinations_key
          }
        });
      }
    } catch (e) {
      console.error("Erro crítico ao buscar perfil:", e);
    }
  }
}));
