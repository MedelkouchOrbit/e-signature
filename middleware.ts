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
    '/about'
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
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/'
  
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
    
    // Optional: Validate token format (basic validation)
    if (sessionToken.length < 10) {
      console.log('❌ Middleware: BLOCKING access - invalid token format')
      const loginUrl = new URL('/en/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
    console.log('✅ Middleware: Allowing access to PRIVATE route - valid session token found')
  } else {
    console.log('✅ Middleware: Allowing access to PUBLIC route:', pathname, '(without locale:', pathWithoutLocale, ')')
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
  // Match only internationalized pathnames, exclude static assets
  matcher: [
    // Include all paths except static assets and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.).*)',
    // Include root path
    '/',
    // Include specific localized paths
    '/(ar|en)/:path*'
  ],
}