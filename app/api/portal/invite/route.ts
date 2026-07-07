export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET /api/portal/invite?token=xxx — validate invite token
export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin.from('client_invites').select('*, clients(name, company)')
      .eq('token', token).eq('status', 'pending').gt('expires_at', new Date().toISOString()).single()
    if (error || !data) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    return NextResponse.json({ email: data.email, client_name: data.clients?.name, company: data.clients?.company })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
