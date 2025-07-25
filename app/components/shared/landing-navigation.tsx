"use client"

import { Button } from "@/components/ui/button"
import { Globe, Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/app/i18n/navigation"
import { WatiqaLogo } from "@/app/components/shared/watiqa-logo"
import { useLanguageSwitch } from "@/app/hooks/use-language-switch"
import { useState, useEffect } from "react"

export default function LandingNavigation() {
  const t = useTranslations("navigation")
  const { switchLocale, currentLanguageLabel } = useLanguageSwitch()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Calculate offset for fixed header (navigation height)
      const headerOffset = 80 // Approximate height of the navigation bar
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Handle hash-based navigation on page load
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const sectionId = hash.replace('#', '')
      // Small delay to ensure the page is fully loaded
      setTimeout(() => scrollToSection(sectionId), 100)
    }
  }, [])

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down w-full max-w-[1296px] px-4">
      <div 
        className="flex items-center gap-8 border-2 border-[#ADB1BC] rounded-2xl px-8 py-4 w-full"
        style={{
          background: "linear-gradient(90deg, #4653BB 0%, #180F38 100%)"
        }}
      >
        {/* Logo link - uses next-intl Link for page navigation */}
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
          <WatiqaLogo className="h-8 w-8 transition-transform group-hover:scale-110" />
          <span className="text-white font-semibold text-lg">WatiqaSign</span>
        </Link>

        {/* Desktop Navigation - use buttons for smooth scrolling */}
        <div className="hidden lg:flex items-center gap-x-8 flex-1">
          {[
            { key: "features", sectionId: "features" },
            { key: "benefits", sectionId: "benefits" },
            { key: "ecological", sectionId: "ecological" },
            { key: "pricing", sectionId: "pricing" },
            { key: "contactUs", sectionId: "contact" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => scrollToSection(item.sectionId)}
              className="text-white hover:text-slate-200 transition-colors duration-300 font-medium cursor-pointer"
            >
              {t(item.key)}
            </button>
          ))}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex items-center gap-x-4">
          <Link href="/auth/login">
            <Button 
              variant="ghost" 
              className="text-white hover:text-slate-200 bg-white/10 hover:bg-white/20 rounded-full px-6"
            >
              {t("signIn")}
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 transition-all duration-300 rounded-full px-6">
              {t("freeTrial")}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="default"
            className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full"
            onClick={() => switchLocale("LandingNavigation")}
          >
            <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
            {currentLanguageLabel}
          </Button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="lg:hidden ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-white"
            onClick={() => {
              console.log("Burger menu button clicked! isMenuOpen before:", isMenuOpen)
              setIsMenuOpen(!isMenuOpen)
              console.log("isMenuOpen after (will reflect in next render):", !isMenuOpen)
            }}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-r from-[#4653BB] to-[#180F38] border border-[#ADB1BC] rounded-2xl mx-4 animate-slide-down">
          <nav className="px-6 py-4 space-y-4">
            {/* Mobile Navigation Links - use buttons for smooth scrolling */}
            {[
              { key: "features", sectionId: "features" },
              { key: "benefits", sectionId: "benefits" },
              { key: "ecological", sectionId: "ecological" },
              { key: "pricing", sectionId: "pricing" },
              { key: "contactUs", sectionId: "contact" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  scrollToSection(item.sectionId)
                  setIsMenuOpen(false) // Close menu on link click
                }}
                className="block text-white hover:text-slate-200 transition-colors duration-300 py-2 font-medium text-left w-full"
              >
                {t(item.key)}
              </button>
            ))}
            <div className="pt-4 space-y-2">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  className="w-full text-white hover:text-slate-200 bg-white/10 hover:bg-white/20 rounded-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 transition-all duration-300 rounded-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("freeTrial")}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="default"
                className="w-full border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full"
                onClick={() => {
                  switchLocale("LandingNavigation-Mobile")
                  setIsMenuOpen(false) // Close menu after language switch
                }}
              >
                <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                {currentLanguageLabel}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </nav>
  )
}
