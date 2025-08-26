"use client"

import { Bell, LogOut, User, Settings, Globe, ChevronDown, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, Link } from "@/app/i18n/navigation"
import { WatiqaLogo } from "@/app/components/shared/watiqa-logo"
import { useAuthStore } from "@/app/lib/auth/auth-store"
import { useSubscriptionStore } from "@/app/lib/subscription/subscription-store"
import { useLanguageSwitch } from "@/app/hooks/use-language-switch"
import { useIsClient } from "@/app/hooks/use-hydration"
import { useTranslations } from "next-intl"
import { useState, useRef, useEffect } from "react"

export default function MainNavigation() {
  const router = useRouter()
  const { logout, user } = useAuthStore()
  const { isSubscribed } = useSubscriptionStore()
  const { switchLocale, locale } = useLanguageSwitch()
  const t = useTranslations("navbar")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const languageDropdownRef = useRef<HTMLDivElement>(null)
  const isClient = useIsClient()

  // Only use store values after hydration to prevent mismatch
  const safeUser = isClient ? user : null
  const safeIsSubscribed = isClient ? isSubscribed() : false

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const handleSubscribe = () => {
    if (safeIsSubscribed) {
      router.push("/settings/billing-info")
    } else {
      router.push("/pricing")
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 animate-slide-down w-full">
      <div 
        className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 w-full"
        style={{
          background: "linear-gradient(90deg, #4653BB 0%, #180F38 100%)"
        }}
      >
        {/* Logo link */}
        <Link href="/dashboard" className="flex items-center space-x-2 rtl:space-x-reverse">
          <WatiqaLogo className="h-6 w-6 md:h-8 md:w-8 transition-transform group-hover:scale-110" />
          <span className="text-white font-semibold text-base md:text-lg">WatiqaSign</span>
        </Link>

        {/* Dashboard Actions */}
        <div className="flex items-center gap-x-2 md:gap-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 rounded-full p-2"
            title={t("notifications")}
          >
            <Bell className="w-5 h-5" />
          </Button>

          {/* Language switcher dropdown */}
          <div className="relative" ref={languageDropdownRef}>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full text-xs md:text-sm px-2 md:px-3"
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            >
              <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 rtl:mr-0 rtl:ml-1" />
              <span className="hidden sm:inline">{locale === "en" ? "EN" : "العربية"}</span>
              <span className="sm:hidden">{locale === "en" ? "EN" : "AR"}</span>
              <ChevronDown className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />
            </Button>

            {/* Language Dropdown Menu */}
            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 md:w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button 
                  onClick={() => {
                    if (locale !== "en") switchLocale("MainNavigation")
                    setIsLanguageDropdownOpen(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                    locale === "en" ? "text-blue-600 bg-blue-50" : "text-gray-700"
                  }`}
                >
                  <span className="w-4 h-4 text-center">🇺🇸</span>
                  {t("english")}
                </button>
                
                <button 
                  onClick={() => {
                    if (locale !== "ar") switchLocale("MainNavigation")
                    setIsLanguageDropdownOpen(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                    locale === "ar" ? "text-blue-600 bg-blue-50" : "text-gray-700"
                  }`}
                >
                  <span className="w-4 h-4 text-center">🇸🇦</span>
                  {t("arabic")}
                </button>
              </div>
            )}
          </div>

          {/* Subscribe/Upgrade/Billing Button - Only show if not subscribed */}
          {!safeIsSubscribed && (
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-400 text-yellow-400 bg-transparent hover:bg-yellow-400/10 rounded-full text-xs md:text-sm px-2 md:px-3 hidden sm:flex"
              onClick={handleSubscribe}
            >
              <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1 rtl:mr-0 rtl:ml-1" />
              <span className="hidden md:inline">{t("subscribe")}</span>
              <span className="md:hidden">Pro</span>
            </Button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-full flex items-center gap-1 md:gap-2 px-2 md:px-3"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="w-6 h-6 md:w-8 md:h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <span className="hidden md:block text-sm">{safeUser?.email?.split('@')[0] || "John Doe"}</span>
              <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 md:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{safeUser?.email?.split('@')[0] || "John Doe"}</p>
                  <p className="text-xs text-gray-500">{safeUser?.email || "john.doe@example.com"}</p>
                </div>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t("viewProfile")}
                </button>
                
                {/* Show Billing for subscribed users, Upgrade for non-subscribed users */}
                <button 
                  onClick={handleSubscribe}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  {safeIsSubscribed ? t("billing") : t("upgrade")}
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
                    {t("logout")}
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
