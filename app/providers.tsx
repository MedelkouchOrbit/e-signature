'use client';

import { ReactNode, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/config/query.config';
import { globalCSRSettings } from '@/config/client-render.config';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create query client instance
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position={globalCSRSettings.notifications.position}
        duration={globalCSRSettings.notifications.duration}
        closeButton={globalCSRSettings.notifications.closeButton}
        richColors={globalCSRSettings.notifications.richColors}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}