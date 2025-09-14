/**
 * ✅ React Query hooks for Templates operations
 * Following modern React Query patterns with proper error handling
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { templatesApiService } from "../templates/templates-api-service"

// Query Keys for React Query caching
export const TEMPLATES_QUERY_KEYS = {
  all: ['templates'] as const,
  lists: () => [...TEMPLATES_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: { limit?: number; skip?: number; searchTerm?: string }) => 
    [...TEMPLATES_QUERY_KEYS.lists(), { ...filters }] as const,
  details: () => [...TEMPLATES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TEMPLATES_QUERY_KEYS.details(), id] as const,
}

/**
 * Hook to get all templates
 */
export function useTemplates(params?: { limit?: number; skip?: number; searchTerm?: string }) {
  return useQuery({
    queryKey: TEMPLATES_QUERY_KEYS.list(params),
    queryFn: () => templatesApiService.getTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get a single template by ID
 */
export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: TEMPLATES_QUERY_KEYS.detail(templateId),
    queryFn: () => templatesApiService.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to create template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      signers: Array<{
        name: string;
        email: string;
        role?: string;
      }>;
      pdfFile: File;
    }) => templatesApiService.createTemplate(data),
    onSuccess: () => {
      // Invalidate and refetch templates list
      queryClient.invalidateQueries({ 
        queryKey: TEMPLATES_QUERY_KEYS.lists() 
      });
    },
  });
}

/**
 * Hook to delete template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => 
      templatesApiService.deleteTemplate(templateId),
    onSuccess: (_, templateId) => {
      // Remove from cache and refetch list
      queryClient.removeQueries({ 
        queryKey: TEMPLATES_QUERY_KEYS.detail(templateId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: TEMPLATES_QUERY_KEYS.lists() 
      });
    },
  });
}

/**
 * Hook to save document as template
 */
export function useSaveAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      documentId: string;
      name: string;
      description?: string;
    }) => templatesApiService.saveAsTemplate(data.documentId, { 
      name: data.name, 
      description: data.description 
    }),
    onSuccess: () => {
      // Invalidate and refetch templates list
      queryClient.invalidateQueries({ 
        queryKey: TEMPLATES_QUERY_KEYS.lists() 
      });
    },
  });
}

/**
 * Hook to update template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      templateId: string;
      name?: string;
      description?: string;
    }) => templatesApiService.updateTemplate(data.templateId, {
      name: data.name,
      description: data.description
    }),
    onSuccess: (_, variables) => {
      // Invalidate specific template and list
      queryClient.invalidateQueries({ 
        queryKey: TEMPLATES_QUERY_KEYS.detail(variables.templateId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: TEMPLATES_QUERY_KEYS.lists() 
      });
    },
  });
}
