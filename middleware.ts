import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { locales, localePrefix } from "./app/i18n/routing"

export default async function middleware(request: NextRequest) {
  // 🔒 AUTH GUARD - Block protected routes at network level (like Angular Guards)
  const { pathname } = request.nextUrl
  
  // Define PUBLIC routes that DON'T require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup', 
    '/auth/reset-password',
    '/features',
    '/pricing',
    '/contact',
    '/terms',
    '/privacy',
    '/about',
    '/test-pdf', // Add test PDF route
    '/test-pdf-direct', // Direct PDF test route
    '/test-status', // PDF status check route
    '/test-complete', // Complete PDF test with signatures
    // Keep some localized routes that still exist
    '/تسجيل-الدخول',
    '/تسجيل-العضوية',
    '/اتصل-بنا',
    '/حول'
  ]
  
  // Define static/system routes to ignore
  const systemRoutes = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/images',
    '/robots.txt',
    '/sitemap.xml'
  ]
  
  // Skip auth check for system routes
  const isSystemRoute = systemRoutes.some(route => pathname.startsWith(route))
  if (isSystemRoute) {
    // Handle internationalization routing for system routes
    const handleI18nRouting = createMiddleware({
      defaultLocale: "en",
      locales,
      localePrefix,
    })
    return handleI18nRouting(request) as NextResponse
  }
  
  // Remove locale prefix to check the actual route (e.g., /en/dashboard -> /dashboard)
  // Also decode URL-encoded characters for Arabic routes
  const pathWithoutLocale = decodeURIComponent(pathname.replace(/^\/(en|ar)/, '')) || '/'
  
  // Special handling for root paths
  const isRootPath = pathname === '/' || pathname === '/en' || pathname === '/ar'
  
  // Check if current path is a public route
  const isPublicRoute = isRootPath || publicRoutes.some(route => 
    pathWithoutLocale === route || (route !== '/' && pathWithoutLocale.startsWith(route))
  )
  
  // 🚫 BLOCK ALL PRIVATE ROUTES (everything not in publicRoutes)
  if (!isPublicRoute) {
    // Get session token from cookies or request headers
    const sessionToken = request.cookies.get('opensign_session_token')?.value ||
                         request.headers.get('x-session-token')
    
    console.log('🔒 Middleware: Checking PRIVATE route:', pathname, '(without locale:', pathWithoutLocale, ')')
    console.log('🔑 Session token present:', !!sessionToken)
    
    // If no session token, redirect to login (BLOCK AT NETWORK LEVEL)
    if (!sessionToken || sessionToken.trim() === '') {
      console.log('❌ Middleware: BLOCKING access - no session token found')
      
      // Create login redirect URL
      const loginUrl = new URL('/en/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname) // Remember where they wanted to go
      
      // Return redirect response - THIS BLOCKS THE REQUEST AT NETWORK LEVEL
      return NextResponse.redirect(loginUrl)
    }
    
    // Basic token format validation (more thorough validation happens in AuthGuard)
    if (sessionToken.length < 10 || !sessionToken.startsWith('r:')) {
      console.log('❌ Middleware: BLOCKING access - invalid token format')
      const loginUrl = new URL('/en/auth/login', request.url)
      // Clear the invalid token
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('opensign_session_token')
      return response
    }
    
    console.log('✅ Middleware: Allowing access to PRIVATE route - session token format valid (AuthGuard will validate expiry)')
  } else {
    console.log('✅ Middleware: Checking PUBLIC route:', pathname, '(without locale:', pathWithoutLocale, ')')
    
    // 🚫 BLOCK AUTH PAGES if user has valid session token
    const authPages = ['/auth/login', '/auth/signup', '/auth/reset-password']
    const isAuthPage = authPages.includes(pathWithoutLocale)
    
    if (isAuthPage) {
      const sessionToken = request.cookies.get('opensign_session_token')?.value
      
      if (sessionToken && sessionToken.trim() !== '' && sessionToken.startsWith('r:') && sessionToken.length >= 10) {
        console.log('� Middleware: BLOCKING access to auth page - user has valid session token')
        console.log('🔄 Middleware: Redirecting authenticated user to dashboard')
        
        // Redirect to dashboard instead of allowing access to auth pages
        const dashboardUrl = new URL('/en/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
      } else {
        console.log('✅ Middleware: Allowing access to auth page - no valid session token')
      }
    } else {
      console.log('✅ Middleware: Allowing access to non-auth public route')
    }
  }
  
  // Handle internationalization routing
  const handleI18nRouting = createMiddleware({
    defaultLocale: "en",
    locales,
    localePrefix,
  })

  return handleI18nRouting(request) as NextResponse
}

export const config = {
  // Match only internationalized pathnames, exclude static assets and test routes
  matcher: [
    // Include all paths except static assets, API routes, and test routes
    '/((?!api|_next/static|_next/image|favicon.ico|images|test-pdf|test-pdf-direct|test-status|test-complete|.*\\.).*)',
    // Include root path
    '/',
    // Include specific localized paths
    '/(ar|en)/:path*'
  ],
}