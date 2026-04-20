import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [provider, setProvider] = useState<AIProvider>(
    (localStorage.getItem('ai_provider') as AIProvider) || 'gemini'
  );
  const [byopKey, setByopKey] = useState<string | null>(localStorage.getItem('pollinations_key'));
  const [openaiKey, setOpenaiKey] = useState<string | null>(localStorage.getItem('openai_key'));
  const [anthropicKey, setAnthropicKey] = useState<string | null>(localStorage.getItem('anthropic_key'));
  const [geminiKey, setGeminiKey] = useState<string | null>(localStorage.getItem('gemini_key'));
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    localStorage.setItem('ai_provider', provider);
  }, [provider]);

  useEffect(() => {
    if (byopKey) localStorage.setItem('pollinations_key', byopKey);
    else localStorage.removeItem('pollinations_key');
  }, [byopKey]);

  useEffect(() => {
    if (openaiKey) localStorage.setItem('openai_key', openaiKey);
    else localStorage.removeItem('openai_key');
  }, [openaiKey]);

  useEffect(() => {
    if (anthropicKey) localStorage.setItem('anthropic_key', anthropicKey);
    else localStorage.removeItem('anthropic_key');
  }, [anthropicKey]);

  useEffect(() => {
    if (geminiKey) localStorage.setItem('gemini_key', geminiKey);
    else localStorage.removeItem('gemini_key');
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
