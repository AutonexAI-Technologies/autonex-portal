import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public auth routes — always accessible
  const publicPaths = ['/login', '/invite', '/reset-password']
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Create supabase server client
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase()

  // Redirect unauthenticated users to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify client portal user is active and exists in the database
  if (email) {
    const { data: portalUser } = await supabase
      .from('portal_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!portalUser) {
      const url = new URL('/login', request.url)
      url.searchParams.set('error', 'access_denied')
      const res = NextResponse.redirect(url)
      
      // Clear all Supabase cookies to log them out
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.includes('supabase') || cookie.name.startsWith('sb-')) {
          res.cookies.delete(cookie.name)
        }
      })
      return res
    }
  }

  // Only block if user_type is explicitly set to 'team' (internal staff)
  const userType = user.app_metadata?.user_type
  if (userType === 'team') {
    return NextResponse.redirect(new URL('/login?error=access_denied', request.url))
  }

  // Redirect root to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)'],
}
