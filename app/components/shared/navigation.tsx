"use client"

import { usePathname } from "@/app/i18n/navigation"
import LandingNavigation from "./landing-navigation"
import AuthNavigation from "./auth-navigation"
import MainNavigation from "./main-navigation"

export default function Navigation() {
  const pathname = usePathname()

  // Determine which navigation to show based on the current route
  const getNavigationType = () => {
    // Auth pages (login, signup)
    if (pathname.includes('/auth/')) {
      return 'auth'
    }
    
    // Dashboard and protected routes
    if (pathname.includes('/dashboard') || 
        pathname.includes('/billing') || 
        pathname.includes('/settings') ||
        pathname.includes('/admin') ||
        pathname.includes('/reports') ||
        pathname.includes('/documents') ||
        pathname.includes('/templates') ||
        pathname.includes('/team') ||
        pathname.includes('/profile')) {
      return 'dashboard'
    }
    
    // Landing page and public pages (default)
    return 'landing'
  }

  const navigationType = getNavigationType()

  // Render the appropriate navigation component
  switch (navigationType) {
    case 'auth':
      return <AuthNavigation />
    case 'dashboard':
      return <MainNavigation />
    case 'landing':
    default:
      return <LandingNavigation />
  }
}
