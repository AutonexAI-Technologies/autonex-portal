export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'
import crypto from 'crypto'

// POST — Invite a colleague to the portal
export async function POST(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const body = await req.json()
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await admin.from('client_invites').insert({
      client_id: body.client_id,
      email: body.email,
      role: body.role || 'client_viewer',
      token,
      status: 'pending',
      expires_at: expiresAt,
      invited_by: body.invited_by,
    }).select().single()
    if (error) throw error

    return NextResponse.json({ ...data, invite_link: `${body.origin || ''}/invite/${token}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
