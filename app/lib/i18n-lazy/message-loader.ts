/**
 * Advanced Message Loader for Lazy Loading Translations
 * 
 * This system provides:
 * - Namespace-based code splitting
 * - Dynamic loading with caching
 * - Fallback handling
 * - Performance optimization
 */

type Locale = 'en' | 'ar';
type MessageNamespace = 
  | 'common'           // Shared across all pages
  | 'landing'          // Landing page specific
  | 'auth'             // Authentication pages
  | 'dashboard'        // Dashboard specific
  | 'pricing'          // Pricing page specific
  | 'features'         // Features page specific
  | 'navigation'       // Navigation specific
  | 'footer'           // Footer specific
  | 'forms'            // Form validations and labels
  | 'errors';          // Error messages

type MessageValue = string | Record<string, unknown> | unknown[];
type Messages = Record<string, MessageValue>;

interface MessageModule {
  default: Messages;
}

// Cache for loaded namespaces
const messageCache = new Map<string, Messages>();

/**
 * Cache key generator
 */
const getCacheKey = (locale: Locale, namespace: MessageNamespace): string => 
  `${locale}:${namespace}`;

/**
 * Dynamic import function for namespace-based message loading
 */
const loadMessageNamespace = async (
  locale: Locale, 
  namespace: MessageNamespace
): Promise<Messages> => {
  const cacheKey = getCacheKey(locale, namespace);
  
  // Return cached version if available
  if (messageCache.has(cacheKey)) {
    return messageCache.get(cacheKey)!;
  }

  try {
    // Dynamic import based on namespace
    const messageModule: MessageModule = await import(
      `../../../messages/namespaces/${locale}/${namespace}.json`
    );
    
    const messages = messageModule.default;
    messageCache.set(cacheKey, messages);
    return messages;
  } catch (error) {
    console.warn(`Failed to load namespace ${namespace} for locale ${locale}:`, error);
    
    // Fallback to English if current locale fails
    if (locale !== 'en') {
      try {
        const fallbackModule: MessageModule = await import(
          `../../../messages/namespaces/en/${namespace}.json`
        );
        const fallbackMessages = fallbackModule.default;
        messageCache.set(cacheKey, fallbackMessages);
        return fallbackMessages;
      } catch (fallbackError) {
        console.error(`Fallback also failed for namespace ${namespace}:`, fallbackError);
      }
    }
    
    return {}; // Return empty object as last resort
  }
};

/**
 * Load multiple namespaces at once
 */
export const loadNamespaces = async (
  locale: Locale,
  namespaces: MessageNamespace[]
): Promise<Messages> => {
  const promises = namespaces.map(namespace => 
    loadMessageNamespace(locale, namespace).then(messages => ({ [namespace]: messages }))
  );
  
  const results = await Promise.all(promises);
  return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
};

/**
 * Preload critical namespaces for better UX
 */
export const preloadCriticalNamespaces = async (locale: Locale): Promise<void> => {
  const criticalNamespaces: MessageNamespace[] = ['common', 'navigation', 'errors'];
  await loadNamespaces(locale, criticalNamespaces);
};

/**
 * Get messages for a specific namespace with loading state
 */
export const getNamespaceMessages = async (
  locale: Locale,
  namespace: MessageNamespace
): Promise<Messages> => {
  return loadMessageNamespace(locale, namespace);
};

/**
 * Clear cache (useful for development or memory management)
 */
export const clearMessageCache = (): void => {
  messageCache.clear();
};

/**
 * Get cache stats for debugging
 */
export const getCacheStats = () => ({
  size: messageCache.size,
  keys: Array.from(messageCache.keys()),
  memoryUsage: JSON.stringify(Object.fromEntries(messageCache)).length
});

export type { Locale, MessageNamespace };
