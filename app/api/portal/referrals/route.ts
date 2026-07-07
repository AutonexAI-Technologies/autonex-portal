export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET — Referral data for client
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const clientId = req.headers.get('x-client-id')
    if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    const { data: referral } = await admin.from('referrals')
      .select('*').eq('client_id', clientId).maybeSingle()
    const { data: credits } = await admin.from('referral_credits')
      .select('*').eq('referrer_client_id', clientId).order('created_at', { ascending: false })
    return NextResponse.json({ referral, credits: credits ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
