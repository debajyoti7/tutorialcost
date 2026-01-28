import { useState, useEffect, useCallback } from 'react';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    setApiKeyState(stored);
    setIsLoaded(true);
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKeyState(null);
  }, []);

  const hasApiKey = Boolean(apiKey);

  const maskedKey = apiKey 
    ? `${apiKey.slice(0, 8)}${'*'.repeat(Math.max(0, apiKey.length - 12))}${apiKey.slice(-4)}`
    : null;

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
    maskedKey,
    isLoaded
  };
}
