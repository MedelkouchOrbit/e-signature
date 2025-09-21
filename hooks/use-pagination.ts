import { useState, useCallback, useMemo } from 'react'

export interface PaginationConfig {
  initialPage?: number
  initialLimit?: number
  totalItems?: number
}

export interface UsePaginationReturn {
  currentPage: number
  limit: number
  offset: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  isFirstPage: boolean
  isLastPage: boolean
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setTotalItems: (total: number) => void
  nextPage: () => void
  previousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  reset: () => void
}

/**
 * Custom hook for managing pagination state
 * Provides pagination calculations and navigation functions
 */
export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  totalItems = 0
}: PaginationConfig = {}): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [limit, setLimitState] = useState(initialLimit)
  const [totalItemsState, setTotalItemsState] = useState(totalItems)

  // Calculated values
  const offset = useMemo(() => (currentPage - 1) * limit, [currentPage, limit])
  const totalPages = useMemo(() => Math.ceil(totalItemsState / limit), [totalItemsState, limit])
  const hasNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages])
  const hasPrevious = useMemo(() => currentPage > 1, [currentPage])
  const isFirstPage = useMemo(() => currentPage === 1, [currentPage])
  const isLastPage = useMemo(() => currentPage === totalPages || totalPages === 0, [currentPage, totalPages])

  // Set page with validation
  const setPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1))
    setCurrentPage(validPage)
  }, [totalPages])

  // Set limit and reset to first page
  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit)
    setCurrentPage(1)
  }, [])

  // Set total items
  const setTotalItems = useCallback((total: number) => {
    setTotalItemsState(total)
    // If current page exceeds available pages, go to last page
    const newTotalPages = Math.ceil(total / limit)
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages)
    }
  }, [currentPage, limit])

  // Navigation functions
  const nextPage = useCallback(() => {
    if (hasNext) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, hasNext])

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage, hasPrevious])

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const goToLastPage = useCallback(() => {
    if (totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages])

  // Reset to initial state
  const reset = useCallback(() => {
    setCurrentPage(initialPage)
    setLimitState(initialLimit)
    setTotalItemsState(totalItems)
  }, [initialPage, initialLimit, totalItems])

  return {
    currentPage,
    limit,
    offset,
    totalItems: totalItemsState,
    totalPages,
    hasNext,
    hasPrevious,
    isFirstPage,
    isLastPage,
    setPage,
    setLimit,
    setTotalItems,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    reset
  }
}

/**
 * Hook for managing infinite scroll/load more pagination
 */
export function useInfinitePagination({
  initialLimit = 10,
  totalItems = 0
}: Omit<PaginationConfig, 'initialPage'> = {}) {
  const [limit, setLimit] = useState(initialLimit)
  const [loadedItems, setLoadedItems] = useState(0)
  const [totalItemsState, setTotalItemsState] = useState(totalItems)

  const hasMore = useMemo(() => loadedItems < totalItemsState, [loadedItems, totalItemsState])
  const canLoadMore = useMemo(() => hasMore && loadedItems > 0, [hasMore, loadedItems])

  const loadMore = useCallback(() => {
    if (hasMore) {
      setLoadedItems(prev => Math.min(prev + limit, totalItemsState))
    }
  }, [hasMore, limit, totalItemsState])

  const setTotalItems = useCallback((total: number) => {
    setTotalItemsState(total)
  }, [])

  const reset = useCallback(() => {
    setLoadedItems(0)
    setLimit(initialLimit)
    setTotalItemsState(totalItems)
  }, [initialLimit, totalItems])

  const loadInitial = useCallback(() => {
    setLoadedItems(Math.min(limit, totalItemsState))
  }, [limit, totalItemsState])

  return {
    limit,
    loadedItems,
    totalItems: totalItemsState,
    hasMore,
    canLoadMore,
    setLimit,
    setTotalItems,
    loadMore,
    loadInitial,
    reset
  }
}