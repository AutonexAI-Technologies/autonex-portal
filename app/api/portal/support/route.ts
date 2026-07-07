export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET — Support tickets for client
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const clientId = req.headers.get('x-client-id')
    if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    const { data, error } = await admin.from('support_tickets')
      .select('*, ticket_responses(*)').eq('client_id', clientId).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — Create support ticket
export async function POST(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const body = await req.json()
    const { data, error } = await admin.from('support_tickets').insert({
      client_id: body.client_id,
      subject: body.subject,
      description: body.description,
      category: body.category || 'general',
      priority: body.priority || 'medium',
      created_by: body.created_by,
    }).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
