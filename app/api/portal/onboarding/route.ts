import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET — Onboarding tasks for client
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const clientId = req.headers.get('x-client-id')
    if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    const { data: checklist } = await admin.from('onboarding_checklists')
      .select('*').eq('client_id', clientId).maybeSingle()
    const { data: tasks, error } = await admin.from('onboarding_tasks')
      .select('*').eq('client_id', clientId).order('sort_order')
    if (error) throw error
    return NextResponse.json({ checklist, tasks: tasks ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
