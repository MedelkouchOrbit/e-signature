import { useEffect, useState } from 'react'

/**
 * Custom hook to handle hydration issues with client-side state.
 * Returns false during SSR and initial hydration, then true after hydration is complete.
 */
export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Custom hook to safely use zustand stores that depend on localStorage during hydration.
 * Returns default values during SSR and initial hydration.
 */
export const useHydrationSafeStore = <T>(
  useStore: () => T,
  defaultValue: T
): T => {
  const isClient = useIsClient()
  const storeValue = useStore()

  if (!isClient) {
    return defaultValue
  }

  return storeValue
}
