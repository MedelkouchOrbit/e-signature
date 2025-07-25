"use client"

import { Bell, LogOut, User, Settings, Globe, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, Link } from "@/app/i18n/navigation"
import { WatiqaLogo } from "@/app/components/shared/watiqa-logo"
import { useAuthStore } from "@/app/lib/auth/auth-store"
import { useLanguageSwitch } from "@/app/hooks/use-language-switch"
import { useState, useRef, useEffect } from "react"

export default function DashboardNavigation() {
  const router = useRouter()
  const { logout, user } = useAuthStore()
  const { switchLocale, currentLanguageLabel } = useLanguageSwitch()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down w-full max-w-[1296px] px-4">
      <div 
        className="flex items-center justify-between border-2 border-[#ADB1BC] rounded-2xl px-8 py-4 w-full"
        style={{
          background: "linear-gradient(90deg, #4653BB 0%, #180F38 100%)"
        }}
      >
        {/* Logo link */}
        <Link href="/dashboard" className="flex items-center space-x-2 rtl:space-x-reverse">
          <WatiqaLogo className="h-8 w-8 transition-transform group-hover:scale-110" />
          <span className="text-white font-semibold text-lg">WatiqaSign</span>
        </Link>

        {/* Dashboard Actions */}
        <div className="flex items-center gap-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 rounded-full p-2"
          >
            <Bell className="w-5 h-5" />
          </Button>

          {/* Language switcher */}
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full"
            onClick={() => switchLocale("DashboardNavigation")}
          >
            <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
            {currentLanguageLabel}
          </Button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-full flex items-center gap-2"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden md:block">{user?.email?.split('@')[0] || "John Doe"}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0] || "John Doe"}</p>
                  <p className="text-xs text-gray-500">{user?.email || "john.doe@example.com"}</p>
                </div>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  View Profile
                </button>
                
                <button 
                  onClick={() => switchLocale("DashboardNavigation-Dropdown")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Switch to {currentLanguageLabel}
                </button>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
