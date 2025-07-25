/**
 * Enhanced i18n Configuration with Lazy Loading Support
 * 
 * This configuration supports both:
 * 1. Current monolithic JSON files (for your current setup)
 * 2. Future namespace-based lazy loading (when files get large)
 */

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Feature flag to enable/disable lazy loading
const ENABLE_LAZY_LOADING = process.env.NEXT_PUBLIC_ENABLE_LAZY_LOADING === 'true';

// When lazy loading is disabled, load all messages traditionally
const loadAllMessages = async (locale: string) => {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    
    // Fallback to English if the locale fails
    if (locale !== 'en') {
      try {
        return (await import(`@/messages/en.json`)).default;
      } catch (fallbackError) {
        console.error('Failed to load fallback English messages:', fallbackError);
        return {};
      }
    }
    
    return {};
  }
};

// When lazy loading is enabled, load only critical namespaces initially
const loadCriticalMessages = async (locale: string) => {
  try {
    // These namespaces are always loaded for basic app functionality
    const criticalNamespaces = ['common', 'navigation', 'errors'];
    const messages: Record<string, unknown> = {};
    
    for (const namespace of criticalNamespaces) {
      try {
        const namespaceMessages = (await import(
          `../../messages/namespaces/${locale}/${namespace}.json`
        )).default;
        messages[namespace] = namespaceMessages;
      } catch (error) {
        console.warn(`Failed to load critical namespace ${namespace} for ${locale}:`, error);
        
        // Try fallback to English
        if (locale !== 'en') {
          try {
            const fallbackMessages = (await import(
              `../../messages/namespaces/en/${namespace}.json`
            )).default;
            messages[namespace] = fallbackMessages;
          } catch (fallbackError) {
            console.error(`Fallback also failed for namespace ${namespace}:`, fallbackError);
          }
        }
      }
    }
    
    return messages;
  } catch (error) {
    console.error('Failed to load critical messages:', error);
    return {};
  }
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale parameter is valid
  if (locale !== 'en' && locale !== 'ar') {
    notFound();
  }

  // Choose loading strategy based on feature flag
  const messages = ENABLE_LAZY_LOADING 
    ? await loadCriticalMessages(locale)
    : await loadAllMessages(locale);

  return {
    locale,
    messages,
    // Enhanced error handling
    onError(error) {
      if (error.code === 'MISSING_MESSAGE') {
        // Log missing translations in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Missing translation:', error.message);
        }
      } else {
        // Report other errors to monitoring service in production
        console.error('Translation error:', error);
      }
    },
    // Provide better fallbacks
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter(Boolean).join('.');
      
      if (error.code === 'MISSING_MESSAGE') {
        // Return a clear indication of missing translation
        return `[Missing: ${path}]`;
      } else {
        // Return a developer-friendly error message
        return `[Error: ${path}]`;
      }
    }
  };
});
