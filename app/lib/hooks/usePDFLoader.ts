import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePDFLoaderResult {
  pdfUrl: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Custom hook for loading PDF documents with proper blob URL management
 * Handles base64 content conversion and URL cleanup
 */
export function usePDFLoader(documentId: string | null): UsePDFLoaderResult {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const lastLoadedDocumentId = useRef<string | null>(null);

  const loadPDF = useCallback(async () => {
    if (!documentId || loadingRef.current || lastLoadedDocumentId.current === documentId) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Dynamic import to avoid SSR issues - use main documents API service
      const { documentsApiService } = await import('../documents-api-service');
      
      // Get the document URL/content from the service
      const url = await documentsApiService.downloadDocument(documentId);
      
      // Clean up previous URL if it's a blob URL
      setPdfUrl(currentUrl => {
        if (currentUrl && currentUrl.startsWith('blob:')) {
          URL.revokeObjectURL(currentUrl);
        }
        return url;
      });
      
      lastLoadedDocumentId.current = documentId;
      console.log('✅ PDF loaded successfully for document:', documentId);
    } catch (err) {
      console.error('PDF loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [documentId]);

  const reload = useCallback(() => {
    lastLoadedDocumentId.current = null;
    loadingRef.current = false;
    loadPDF();
  }, [loadPDF]);

  useEffect(() => {
    loadPDF();
  }, [loadPDF]);

  // Cleanup blob URLs on unmount or when URL changes
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return { 
    pdfUrl, 
    loading, 
    error, 
    reload
  };
}
