import { useState, useEffect, useCallback } from 'react';

const GEMINI_KEY_STORAGE = 'gemini_api_key';
const OPENROUTER_KEY_STORAGE = 'openrouter_api_key';
const PROVIDER_STORAGE = 'ai_provider';

export type AiProvider = 'gemini' | 'openrouter';

export function useApiKey() {
  const [geminiKey, setGeminiKeyState] = useState<string | null>(null);
  const [openrouterKey, setOpenrouterKeyState] = useState<string | null>(null);
  const [provider, setProviderState] = useState<AiProvider>('gemini');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setGeminiKeyState(localStorage.getItem(GEMINI_KEY_STORAGE));
    setOpenrouterKeyState(localStorage.getItem(OPENROUTER_KEY_STORAGE));
    const stored = localStorage.getItem(PROVIDER_STORAGE) as AiProvider | null;
    if (stored === 'gemini' || stored === 'openrouter') {
      setProviderState(stored);
    }
    setIsLoaded(true);
  }, []);

  const apiKey = provider === 'gemini' ? geminiKey : openrouterKey;
  const hasApiKey = Boolean(apiKey);

  const setApiKey = useCallback((key: string | null) => {
    if (provider === 'gemini') {
      if (key) {
        localStorage.setItem(GEMINI_KEY_STORAGE, key);
      } else {
        localStorage.removeItem(GEMINI_KEY_STORAGE);
      }
      setGeminiKeyState(key);
    } else {
      if (key) {
        localStorage.setItem(OPENROUTER_KEY_STORAGE, key);
      } else {
        localStorage.removeItem(OPENROUTER_KEY_STORAGE);
      }
      setOpenrouterKeyState(key);
    }
  }, [provider]);

  const clearApiKey = useCallback(() => {
    if (provider === 'gemini') {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
      setGeminiKeyState(null);
    } else {
      localStorage.removeItem(OPENROUTER_KEY_STORAGE);
      setOpenrouterKeyState(null);
    }
  }, [provider]);

  const setProvider = useCallback((p: AiProvider) => {
    localStorage.setItem(PROVIDER_STORAGE, p);
    setProviderState(p);
  }, []);

  const maskedKey = apiKey 
    ? `${apiKey.slice(0, 8)}${'*'.repeat(Math.max(0, apiKey.length - 12))}${apiKey.slice(-4)}`
    : null;

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
    maskedKey,
    isLoaded,
    provider,
    setProvider,
    geminiKey,
    openrouterKey,
  };
}
