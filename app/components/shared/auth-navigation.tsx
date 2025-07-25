"use client"

import { Globe } from "lucide-react"
import { Link } from "@/app/i18n/navigation"
import { WatiqaLogo } from "@/app/components/shared/watiqa-logo"
import { Button } from "@/components/ui/button"
import { useLanguageSwitch } from "@/app/hooks/use-language-switch"

export default function AuthNavigation() {
  const { switchLocale, currentLanguageLabel } = useLanguageSwitch()

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down w-full max-w-[1296px] px-4">
      <div 
        className="flex items-center justify-between border-2 border-[#ADB1BC] rounded-2xl px-8 py-4 w-full"
        style={{
          background: "linear-gradient(90deg, #4653BB 0%, #180F38 100%)"
        }}
      >
        {/* Logo link */}
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
          <WatiqaLogo className="h-8 w-8 transition-transform group-hover:scale-110" />
          <span className="text-white font-semibold text-lg">WatiqaSign</span>
        </Link>

        {/* Language switcher */}
        <Button
          variant="outline"
          size="default"
          className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full"
          onClick={() => switchLocale("AuthNavigation")}
        >
          <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
          {currentLanguageLabel}
        </Button>
      </div>
    </nav>
  )
}
