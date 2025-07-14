import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { notify } from '@/lib/utils';

// Generic API hook for GET requests
export function useApiGet<T>(
  key: string | string[],
  url: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: () => apiClient.get<T>(url),
    ...options,
  });
}

// Generic API hook for mutations with notifications
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const { successMessage, errorMessage, ...mutationOptions } = options || {};
  
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      if (successMessage) notify.success(successMessage);
      mutationOptions.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (errorMessage) notify.error(errorMessage);
      mutationOptions.onError?.(error, variables, context);
    },
    ...mutationOptions,
  });
}