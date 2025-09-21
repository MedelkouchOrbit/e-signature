import { useState, useCallback } from 'react'

export interface UseLoadingReturn {
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  execute: <T>(asyncFn: () => Promise<T>) => Promise<T | null>
  reset: () => void
}

/**
 * Custom hook for managing loading states and errors
 * Provides a consistent way to handle async operations
 */
export function useLoading(initialLoading = false): UseLoadingReturn {
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const setErrorState = useCallback((error: string | null) => {
    setError(error)
  }, [])

  const execute = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await asyncFn()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    setLoading,
    setError: setErrorState,
    execute,
    reset
  }
}

/**
 * Hook for managing multiple loading states with keys
 * Useful when you have multiple async operations in a single component
 */
export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }))
  }, [])

  const setError = useCallback((key: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [key]: error }))
  }, [])

  const execute = useCallback(async <T>(
    key: string, 
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(key, true)
      setError(key, null)
      const result = await asyncFn()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(key, errorMessage)
      return null
    } finally {
      setLoading(key, false)
    }
  }, [setLoading, setError])

  const isLoading = useCallback((key: string) => loadingStates[key] || false, [loadingStates])
  const getError = useCallback((key: string) => errors[key] || null, [errors])
  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: false }))
      setErrors(prev => ({ ...prev, [key]: null }))
    } else {
      setLoadingStates({})
      setErrors({})
    }
  }, [])

  return {
    isLoading,
    getError,
    isAnyLoading,
    setLoading,
    setError,
    execute,
    reset
  }
}