import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

export const queryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // CSR-optimized settings
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
};

export const createQueryClient = () => new QueryClient(queryConfig);

// Query key factory for consistent key generation
export const queryKeys = {
  all: [''] as const,
  auth: () => [...queryKeys.all, 'auth'] as const,
  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  posts: () => [...queryKeys.all, 'posts'] as const,
  post: (id: string) => [...queryKeys.posts(), id] as const,
  // Add more keys as needed
};