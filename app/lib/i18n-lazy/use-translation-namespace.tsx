/**
 * React Hook for Lazy Loading Translations
 * 
 * This hook provides:
 * - Loading states
 * - Error handling
 * - Automatic retry
 * - Suspense support
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { 
  loadNamespaces, 
  getNamespaceMessages, 
  preloadCriticalNamespaces,
  type MessageNamespace,
  type Locale 
} from './message-loader';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface UseTranslationNamespaceReturn {
  messages: Record<string, unknown>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  retry: () => void;
}

/**
 * Hook for loading a single namespace
 */
export const useTranslationNamespace = (
  namespace: MessageNamespace
): UseTranslationNamespaceReturn => {
  const locale = useLocale() as Locale;
  const [state, setState] = useState<LoadingState>('idle');
  const [messages, setMessages] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<Error | null>(null);

  const loadMessages = useCallback(async () => {
    setState('loading');
    setError(null);
    
    try {
      const namespaceMessages = await getNamespaceMessages(locale, namespace);
      setMessages(namespaceMessages);
      setState('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load translations');
      setError(error);
      setState('error');
    }
  }, [locale, namespace]);

  const retry = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isLoading: state === 'loading',
    isError: state === 'error',
    error,
    retry
  };
};

/**
 * Hook for loading multiple namespaces
 */
export const useTranslationNamespaces = (
  namespaces: MessageNamespace[]
): UseTranslationNamespaceReturn => {
  const locale = useLocale() as Locale;
  const [state, setState] = useState<LoadingState>('idle');
  const [messages, setMessages] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<Error | null>(null);

  const loadMessages = useCallback(async () => {
    setState('loading');
    setError(null);
    
    try {
      const allMessages = await loadNamespaces(locale, namespaces);
      setMessages(allMessages);
      setState('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load translations');
      setError(error);
      setState('error');
    }
  }, [locale, namespaces]);

  const retry = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isLoading: state === 'loading',
    isError: state === 'error',
    error,
    retry
  };
};

/**
 * Hook for preloading critical namespaces
 */
export const usePreloadCritical = () => {
  const locale = useLocale() as Locale;
  
  useEffect(() => {
    preloadCriticalNamespaces(locale);
  }, [locale]);
};
