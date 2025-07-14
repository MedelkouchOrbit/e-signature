// Generic CSR configuration that can be extended with components

export interface ClientRenderConfig {
  enableSSR: boolean;
  hydrationDelay?: number;
  errorBoundary?: boolean;
  suspenseFallback?: React.ComponentType;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error }>;
}

export interface RouteConfig {
  path: string;
  isClientOnly: boolean;
  preloadData?: boolean;
  requireAuth?: boolean;
  layout?: string;
}

// Default CSR configuration
export const defaultClientConfig: ClientRenderConfig = {
  enableSSR: false,
  hydrationDelay: 0,
  errorBoundary: true,
  suspenseFallback: undefined, // Will be set when you provide components
  loadingComponent: undefined, // Will be set when you provide components
  errorComponent: undefined,    // Will be set when you provide components
};

// Route-specific CSR configurations
export const routeConfigs: Record<string, RouteConfig> = {
  '/dashboard': {
    path: '/dashboard',
    isClientOnly: true,
    preloadData: true,
    requireAuth: true,
    layout: 'dashboard',
  },
  '/analytics': {
    path: '/analytics',
    isClientOnly: true,
    preloadData: false,
    requireAuth: true,
    layout: 'dashboard',
  },
  '/settings': {
    path: '/settings',
    isClientOnly: true,
    preloadData: false,
    requireAuth: true,
    layout: 'dashboard',
  },
};

// Component registry for dynamic imports
export const componentRegistry: Record<string, () => Promise<React.ComponentType<unknown>>> = {
  // Add your components here later
  // Example:
  // 'UserDashboard': () => import('@/components/dashboard/UserDashboard'),
};

// Global CSR settings
export const globalCSRSettings = {
  // API configuration
  api: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
    retryAttempts: 3,
  },
  
  // Feature flags
  features: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
  },
  
  // Performance settings
  performance: {
    lazyLoadThreshold: 0.1,
    prefetchDelay: 50,
    debounceDelay: 300,
  },
  
  // Notification settings (sonner)
  notifications: {
    position: 'bottom-right' as const,
    duration: 4000,
    closeButton: true,
    richColors: true,
  },
};