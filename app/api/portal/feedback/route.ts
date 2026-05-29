import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// POST — Submit feedback
export async function POST(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const body = await req.json()
    const { data, error } = await admin.from('feedback').insert({
      client_id: body.client_id,
      submitted_by: body.submitted_by,
      rating: body.rating,
      what_went_well: body.what_went_well,
      what_to_improve: body.what_to_improve,
      would_refer: body.would_refer ?? false,
    }).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET — Past feedback from this client
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const clientId = req.headers.get('x-client-id')
    if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    const { data, error } = await admin.from('feedback')
      .select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
