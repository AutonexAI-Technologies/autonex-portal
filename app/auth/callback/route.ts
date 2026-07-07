import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /auth/callback
 *
 * Handles:
 *  - Portal invite acceptance
 *  - Password reset (type=recovery)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  const type = searchParams.get('type')   // 'recovery' for password reset
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/settings' : '/dashboard')

  const response = NextResponse.redirect(`${origin}${next}`)

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // If redirected from CRM with session tokens
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) {
      console.error('[portal/auth/callback] setSession failed:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    return response
  }

  if (!code) return response

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.user) {
    console.error('[portal/auth/callback] Code exchange failed:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // For password recovery → redirect to settings (change password there)
  if (type === 'recovery') {
    const recoveryResponse = NextResponse.redirect(`${origin}/settings`, { headers: response.headers })
    return recoveryResponse
  }

  return response
}
