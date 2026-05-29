import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET — Project milestones for client
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const clientId = req.headers.get('x-client-id')
    if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    const { data, error } = await admin.from('project_milestones')
      .select('*, project_updates(*)').eq('client_id', clientId).order('sort_order')
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
