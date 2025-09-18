'use client'

import { useEffect } from 'react'
import { openSignApiService } from '@/app/lib/api-service'

// Extend window interface for debug utilities
declare global {
  interface Window {
    setOpenSignToken: (token: string) => void
    getOpenSignToken: () => string
    clearOpenSignToken: () => void
  }
}

/**
 * Debug component that exposes session token utilities globally
 * Only active in development mode
 */
export function SessionTokenDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Expose debug utilities globally for browser console
      window.setOpenSignToken = (token: string) => {
        console.log('🔧 Setting OpenSign session token for testing...');
        console.log('📋 Token:', token);
        openSignApiService.setOpenSignSessionToken(token);
      };

      window.getOpenSignToken = () => {
        const token = openSignApiService.getSessionToken();
        console.log('🔑 Current session token:', token || 'none');
        return token;
      };

      window.clearOpenSignToken = () => {
        console.log('🗑️ Clearing session token...');
        openSignApiService.clearSessionToken();
        console.log('✅ Session token cleared');
      };

      console.log('🛠️ Debug utilities loaded:');
      console.log('   setOpenSignToken(token) - Set OpenSign session token');
      console.log('   getOpenSignToken() - Get current session token');
      console.log('   clearOpenSignToken() - Clear session token');
      console.log('');
      console.log('💡 To test with superadmin session, run:');
      console.log('   setOpenSignToken("r:cb49ad2c656ef9efc30fc3daf4ced0ba")');
    }
  }, []);

  return null; // This component doesn't render anything
}