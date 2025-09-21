import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: unknown) => void
  onError?: (error: string) => void
}

export interface UseApiReturn<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
  abort: () => void
}

/**
 * Custom hook for making API calls with loading, error, and abort support
 */
export function useApi<T = unknown>(
  apiFunction: (...args: unknown[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { immediate = false, onSuccess, onError } = options
  
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    try {
      // Abort previous request
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      setIsLoading(true)
      setError(null)

      const result = await apiFunction(...args)
      
      if (isMountedRef.current) {
        setData(result)
        onSuccess?.(result)
      }
      
      return result
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(errorMessage)
        onError?.(errorMessage)
      }
      return null
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [apiFunction, onSuccess, onError])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
    abortControllerRef.current?.abort()
  }, [])

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    abort
  }
}

/**
 * Hook for managing multiple API calls
 */
export function useMultipleApi() {
  const [calls, setCalls] = useState<Record<string, {
    data: unknown
    isLoading: boolean
    error: string | null
  }>>({})

  const execute = useCallback(async <T>(
    key: string,
    apiFunction: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setCalls(prev => ({
        ...prev,
        [key]: { data: null, isLoading: true, error: null }
      }))

      const result = await apiFunction()
      
      setCalls(prev => ({
        ...prev,
        [key]: { data: result, isLoading: false, error: null }
      }))
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setCalls(prev => ({
        ...prev,
        [key]: { data: null, isLoading: false, error: errorMessage }
      }))
      return null
    }
  }, [])

  const getState = useCallback((key: string) => {
    return calls[key] || { data: null, isLoading: false, error: null }
  }, [calls])

  const reset = useCallback((key?: string) => {
    if (key) {
      setCalls(prev => ({
        ...prev,
        [key]: { data: null, isLoading: false, error: null }
      }))
    } else {
      setCalls({})
    }
  }, [])

  const isAnyLoading = Object.values(calls).some(call => call.isLoading)

  return {
    execute,
    getState,
    reset,
    isAnyLoading,
    calls
  }
}