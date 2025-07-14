import { StateCreator } from 'zustand';

// Generic store configuration
export interface StoreConfig {
  enableDevtools: boolean;
  enablePersistence: boolean;
  persistKey?: string;
}

export const defaultStoreConfig: StoreConfig = {
  enableDevtools: process.env.NODE_ENV === 'development',
  enablePersistence: true,
  persistKey: 'app-store',
};

// Base store interface that all stores should extend
export interface BaseStore {
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
}

// Store registry for dynamic store creation
export const storeRegistry: Record<string, StateCreator<unknown>> = {
  // Add your stores here later
  // Example:
  // 'user': (set) => ({ user: null, setUser: (user) => set({ user }) }),
};

// Global store types
export interface GlobalStore extends BaseStore {
  // Add global state properties here
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Add more global state as needed
}