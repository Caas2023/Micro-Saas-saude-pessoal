import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

export type AIProvider = 'gemini' | 'openai' | 'pollinations' | 'anthropic';

interface SettingsContextType {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  byopKey: string | null;
  setByopKey: (key: string | null) => void;
  openaiKey: string | null;
  setOpenaiKey: (key: string | null) => void;
  anthropicKey: string | null;
  setAnthropicKey: (key: string | null) => void;
  geminiKey: string | null;
  setGeminiKey: (key: string | null) => void;
  isOffline: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userKeys, updateUserKeys } = useAuthStore();
  
  const [provider, setProvider] = useState<AIProvider>(
    (localStorage.getItem('ai_provider') as AIProvider) || 'gemini'
  );
  
  const [byopKey, setByopKey] = useState<string | null>(localStorage.getItem('pollinations_key'));
  const [openaiKey, setOpenaiKey] = useState<string | null>(localStorage.getItem('openai_key'));
  const [anthropicKey, setAnthropicKey] = useState<string | null>(localStorage.getItem('anthropic_key'));
  const [geminiKey, setGeminiKey] = useState<string | null>(localStorage.getItem('gemini_key'));
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 1. Sincronizar chaves remotas (Supabase -> State) quando o usuário logar
  useEffect(() => {
    if (user && userKeys) {
      if (userKeys.gemini) setGeminiKey(userKeys.gemini);
      if (userKeys.openai) setOpenaiKey(userKeys.openai);
      if (userKeys.anthropic) setAnthropicKey(userKeys.anthropic);
      if (userKeys.pollinations) setByopKey(userKeys.pollinations);
    }
  }, [user, userKeys]);

  // 2. Persistência Local e Remota (State -> Supabase/LocalStorage)
  const syncKey = async (keyName: string, value: string | null, dbColumn: string) => {
    localStorage.setItem(keyName, value || '');
    if (user) {
      await supabase.from('profiles').update({ [dbColumn]: value }).eq('id', user.id);
      updateUserKeys({ [dbColumn.replace('_key', '')]: value });
    }
  };

  useEffect(() => {
    localStorage.setItem('ai_provider', provider);
  }, [provider]);

  useEffect(() => {
    syncKey('pollinations_key', byopKey, 'pollinations_key');
  }, [byopKey]);

  useEffect(() => {
    syncKey('openai_key', openaiKey, 'openai_key');
  }, [openaiKey]);

  useEffect(() => {
    syncKey('anthropic_key', anthropicKey, 'anthropic_key');
  }, [anthropicKey]);

  useEffect(() => {
    syncKey('gemini_key', geminiKey, 'gemini_key');
  }, [geminiKey]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      provider, setProvider, 
      byopKey, setByopKey,
      openaiKey, setOpenaiKey,
      anthropicKey, setAnthropicKey,
      geminiKey, setGeminiKey,
      isOffline 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
