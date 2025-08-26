"use client"

import { usePathname } from "@/app/i18n/navigation"
import Navigation from "./navigation"
import MainLayout from "./main-layout"

interface LayoutRendererProps {
  children: React.ReactNode
}

export default function LayoutRenderer({ children }: LayoutRendererProps) {
  const pathname = usePathname()

  const isMainLayoutRoute = pathname.includes('/dashboard') || 
    pathname.includes('/pricing') || 
    pathname.includes('/settings') ||
    pathname.includes('/admin') ||
    pathname.includes('/reports') ||
    pathname.includes('/documents') ||
    pathname.includes('/templates') ||
    pathname.includes('/team') ||
    pathname.includes('/bulk-send') ||
    pathname.includes('/api') ||
    pathname.includes('/others') ||
    pathname.includes('/help') ||
    pathname.includes('/profile')

  if (isMainLayoutRoute) {
    return <MainLayout>{children}</MainLayout>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      {children}
    </div>
  )
}
