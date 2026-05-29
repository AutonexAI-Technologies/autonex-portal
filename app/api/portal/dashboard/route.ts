import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET — Dashboard aggregate data for the logged-in client
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const clientId = req.headers.get('x-client-id')
    if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })

    const [
      { data: project },
      { data: milestones },
      { data: invoices },
      { data: documents },
      { data: threads },
      { data: tasks },
      { data: health },
    ] = await Promise.all([
      admin.from('projects').select('*').eq('client_id', clientId).maybeSingle(),
      admin.from('project_milestones').select('*').eq('client_id', clientId).order('sort_order'),
      admin.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      admin.from('documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      admin.from('chat_threads').select('*, chat_messages(count)').eq('client_id', clientId),
      admin.from('onboarding_tasks').select('*').eq('client_id', clientId).order('sort_order'),
      admin.from('client_health').select('*').eq('client_id', clientId).maybeSingle(),
    ])

    return NextResponse.json({
      project, milestones: milestones ?? [], invoices: invoices ?? [],
      documents: documents ?? [], threads: threads ?? [], tasks: tasks ?? [], health,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
