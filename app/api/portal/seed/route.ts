import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabaseServer'

/**
 * POST /api/portal/seed
 * Links the currently logged-in user to the first client in the DB as a portal_admin.
 * Only for internal testing — requires authenticated session.
 * Body (optional): { client_id } — if omitted, uses the first client found.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const supabase = createServerSupabaseClient()

    // Must be authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    let clientId = body.client_id

    // If no client_id given, pick the first one
    if (!clientId) {
      const { data: firstClient } = await admin
        .from('clients')
        .select('id, name, email')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      if (!firstClient) {
        return NextResponse.json({ error: 'No clients found. Create a client in the CRM first.' }, { status: 404 })
      }
      clientId = firstClient.id
    }

    // Check if portal_user record already exists for this user
    const { data: existing } = await admin
      .from('portal_users')
      .select('id, client_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        message: 'Already linked',
        portal_user_id: existing.id,
        client_id: existing.client_id,
      })
    }

    // Fetch client info
    const { data: client } = await admin
      .from('clients')
      .select('id, name, email')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Create portal_users record
    const { data: portalUser, error: puErr } = await admin
      .from('portal_users')
      .insert({
        user_id: user.id,
        client_id: clientId,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
        email: user.email,
        phone: null,
        portal_role: 'client_admin',
      })
      .select()
      .single()

    if (puErr) {
      return NextResponse.json({ error: puErr.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Portal account linked successfully!',
      portal_user: portalUser,
      client: client,
    }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/portal/seed]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
