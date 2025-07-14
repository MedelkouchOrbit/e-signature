import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Notification utilities using sonner
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, msgs),
};

// Add more utility functions as needed
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isClient = typeof window !== 'undefined';

export const isBrowser = isClient && typeof document !== 'undefined';