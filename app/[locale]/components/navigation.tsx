"use client"

import { Button } from "@/components/ui/button"
import { Globe, Menu, X } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname, Link } from "@/app/i18n/navigation"
import { WatiqaSignLogo } from "@/components/shared/watiqa-logo"
import { useState } from "react"

export default function Navigation() {
  const t = useTranslations("navigation")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Log current locale and pathname for debugging
  console.log("Navigation Component Rendered. Current locale:", locale, "Pathname:", pathname)

  const switchLocale = () => {
    console.log("Language button clicked!")
    const newLocale = locale === "en" ? "ar" : "en"
    console.log("Attempting to switch locale from", locale, "to", newLocale)
    console.log("Pushing to pathname:", pathname, "with new locale:", newLocale)
    router.push(pathname, { locale: newLocale })
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo link - uses next-intl Link for page navigation */}
          <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <WatiqaSignLogo className="h-10 w-10 transition-transform group-hover:scale-110" />
            <span className="text-white font-semibold text-lg">WatiqaSign</span>
          </Link>

          {/* Desktop Navigation - use standard <a> for in-page anchor links */}
          <div className="hidden md:flex items-center gap-x-8">
            {[
              { key: "features", href: "#features" },
              { key: "benefits", href: "#benefits" },
              { key: "ecological", href: "#ecological" },
              { key: "pricing", href: "#pricing" },
              { key: "contactUs", href: "#contact" },
            ].map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="text-slate-300 hover:text-white transition-colors duration-300"
              >
                {t(item.key)}
              </a>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-x-4">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              {t("signIn")}
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-300">
              {t("freeTrial")}
            </Button>
            <Button
              variant="outline"
              size="default"
              className="border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800"
              onClick={switchLocale}
            >
              <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
              {locale === "en" ? "AR" : "EN"}
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white"
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
        <div className="md:hidden bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 animate-slide-down">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {/* Mobile Navigation Links - use standard <a> for in-page anchor links */}
            {[
              { key: "features", href: "#features" },
              { key: "benefits", href: "#benefits" },
              { key: "ecological", href: "#ecological" },
              { key: "pricing", href: "#pricing" },
              { key: "contactUs", href: "#contact" },
            ].map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="block text-slate-300 hover:text-white transition-colors duration-300 py-2"
                onClick={() => setIsMenuOpen(false)} // Close menu on link click
              >
                {t(item.key)}
              </a>
            ))}
            <div className="pt-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("signIn")}
              </Button>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("freeTrial")}
              </Button>
              <Button
                variant="outline"
                size="default"
                className="w-full border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800"
                onClick={() => {
                  switchLocale()
                  setIsMenuOpen(false) // Close menu after language switch
                }}
              >
                <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                {locale === "en" ? "AR" : "EN"}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </nav>
  )
}
