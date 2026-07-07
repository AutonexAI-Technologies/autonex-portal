import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// ── Founder / Super-Admin email — unrestricted access everywhere ───────────
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'autonexai.org@gmail.com').toLowerCase()

/**
 * Creates a service-role admin client that bypasses RLS.
 * Used to verify portal_users existence without being blocked
 * by RLS policies that depend on JWT app_metadata state.
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Public auth paths (always accessible)
  const isPublicPath = (
    pathname.startsWith('/login') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/api/portal/accept') ||
    (pathname === '/api/portal/invite' && method === 'GET')
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Create supabase server client for session/auth verification
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

  // ── Founder bypass: admin has unrestricted access to portal ───────────────
  // Admin has no portal_users record (they're a team member) so we
  // must whitelist explicitly to allow testing/previewing the portal.
  if (user && email === ADMIN_EMAIL) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // ── Block CRM team members from client portal ─────────────────────────────
  if (user) {
    const userType = user.app_metadata?.user_type
    if (userType === 'team') {
      const url = new URL('/login', request.url)
      url.searchParams.set('error', 'access_denied')
      const res = NextResponse.redirect(url)
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.includes('supabase') || cookie.name.startsWith('sb-')) {
          res.cookies.delete(cookie.name)
        }
      })
      return res
    }
  }

  // ── Helper: check portal_users via admin client (bypasses RLS) ───────────
  async function isValidPortalUser(userEmail: string): Promise<boolean> {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from('portal_users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle()
      return !!data
    } catch {
      // On error, fail open (allow through) to avoid locking out valid users
      return true
    }
  }

  // ── API Route Security ───────────────────────────────────────────────────
  if (pathname.startsWith('/api')) {
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (email) {
      const valid = await isValidPortalUser(email)
      if (!valid) {
        return new NextResponse(
          JSON.stringify({ error: 'Access Denied: Your account has been deactivated' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    return response
  }

  // ── Page Route Security ──────────────────────────────────────────────────
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (email) {
    const valid = await isValidPortalUser(email)
    if (!valid) {
      const url = new URL('/login', request.url)
      url.searchParams.set('error', 'access_denied')
      const res = NextResponse.redirect(url)

      // Clear all Supabase session cookies to fully log them out
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.includes('supabase') || cookie.name.startsWith('sb-')) {
          res.cookies.delete(cookie.name)
        }
      })
      return res
    }
  }

  // Redirect root to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images).*)'],
}
