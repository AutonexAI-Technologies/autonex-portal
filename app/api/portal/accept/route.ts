export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// POST /api/portal/accept — create portal user account from invite
export async function POST(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const { token, name, password, phone } = await req.json()
    if (!token || !name || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Get invite
    const { data: invite, error: ie } = await admin.from('client_invites').select('*, clients(name, company)')
      .eq('token', token).eq('status', 'pending').gt('expires_at', new Date().toISOString()).single()
    if (ie || !invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })

    // Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: invite.email, password, email_confirm: true,
      app_metadata: { user_type: 'client', client_id: invite.client_id },
      user_metadata: { name, phone },
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

    // Create portal_users record
    await admin.from('portal_users').insert({
      user_id: authData.user.id, client_id: invite.client_id,
      name, email: invite.email, phone: phone || null,
      portal_role: invite.role || 'client_admin',
    })

    // Mark invite as accepted
    await admin.from('client_invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', invite.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
