"use client"

import { useState } from "react"
import MainNavigation from "./main-navigation"
import Sidebar from "./sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Navigation at the top */}
      <MainNavigation />
      
      {/* Main content area with sidebar */}
      <div className="flex pt-14"> {/* pt-14 to minimize gap between navigation and content */}
        {/* Desktop Sidebar */}
        <div className={`hidden lg:block flex-shrink-0 min-h-[calc(100vh-3.5rem)] transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}>
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed z-50 transition-all duration-300 border shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl hover:shadow-xl hover:scale-105 lg:hidden top-16 left-4 border-white/20 backdrop-blur-sm group"
            >
              <div className="relative">
                {/* Custom animated hamburger menu */}
                <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
                  <span className={`block h-0.5 w-5 bg-white transition-all duration-300 transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block h-0.5 w-5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-5 bg-white transition-all duration-300 transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
                <div className="absolute w-2 h-2 rounded-full -top-1 -right-1 bg-emerald-400 animate-pulse group-hover:bg-emerald-300"></div>
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 border-r bg-gradient-to-b from-slate-50 to-white">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="px-2 pt-6">
              <div className="px-4 mb-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Navigation
                </h2>
              </div>
              <Sidebar collapsed={false} onToggleCollapse={() => {}} mobile />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Main content */}
        <div className="flex-1 min-h-[calc(100vh-3.5rem)] bg-white lg:ml-0 ml-0 px-4 lg:px-6 pt-16 lg:pt-0">
          <div className="max-w-full lg:max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
