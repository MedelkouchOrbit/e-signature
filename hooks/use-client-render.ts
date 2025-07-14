import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { routeConfigs } from '@/config/client-render.config';

interface UseClientRenderReturn {
  isClient: boolean;
  isLoading: boolean;
  shouldRenderClient: boolean;
  routeConfig: typeof routeConfigs[string] | null;
}

export function useClientRender(): UseClientRenderReturn {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const routeConfig = routeConfigs[pathname] || null;
  const shouldRenderClient = routeConfig?.isClientOnly || false;

  useEffect(() => {
    setIsClient(true);
    setIsLoading(false);
  }, []);

  return {
    isClient,
    isLoading,
    shouldRenderClient,
    routeConfig,
  };
}