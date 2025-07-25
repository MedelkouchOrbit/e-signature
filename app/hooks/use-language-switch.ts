import { useRouter, usePathname } from "@/app/i18n/navigation"
import { useLocale } from "next-intl"

export function useLanguageSwitch() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (sourceComponent?: string) => {
    const component = sourceComponent || "Unknown"
    console.log(`🌐 ${component}: Language switch initiated`)
    console.log(`🌐 Current locale: ${locale}`)
    console.log(`🌐 Current pathname: ${pathname}`)
    
    const newLocale = locale === "en" ? "ar" : "en"
    console.log(`🌐 Target locale: ${newLocale}`)
    
    try {
      // For auth pages, use specific route mapping to avoid pathname translation issues
      if (pathname.includes('/auth/login') || pathname === '/auth/login') {
        const targetUrl = `/${newLocale}/auth/login`
        console.log(`🔄 ${component}: Auth route detected, navigating to: ${targetUrl}`)
        window.location.href = targetUrl
        return
      }
      
      if (pathname.includes('/auth/signup') || pathname === '/auth/signup') {
        const targetUrl = `/${newLocale}/auth/signup`
        console.log(`🔄 ${component}: Auth signup route detected, navigating to: ${targetUrl}`)
        window.location.href = targetUrl
        return
      }

      // For other routes, try the router method first
      console.log(`🔄 ${component}: Attempting router.push with locale...`)
      router.push(pathname, { locale: newLocale })
      console.log(`✅ ${component}: router.push completed`)
    } catch (error) {
      console.error(`❌ ${component}: router.push failed:`, error)
      
      // Fallback: try router.replace
      try {
        console.log(`🔄 ${component}: Trying router.replace fallback...`)
        router.replace(pathname, { locale: newLocale })
        console.log(`✅ ${component}: router.replace completed`)
      } catch (replaceError) {
        console.error(`❌ ${component}: router.replace failed:`, replaceError)
        
        // Final fallback: direct window navigation
        try {
          const currentUrl = window.location.pathname
          const newUrl = currentUrl.replace(`/${locale}`, `/${newLocale}`)
          console.log(`🔄 ${component}: Final fallback - navigating to: ${newUrl}`)
          window.location.href = newUrl
        } catch (fallbackError) {
          console.error(`❌ ${component}: All navigation methods failed:`, fallbackError)
        }
      }
    }
  }

  return {
    locale,
    switchLocale,
    currentLanguageLabel: locale === "en" ? "AR" : "EN"
  }
}
