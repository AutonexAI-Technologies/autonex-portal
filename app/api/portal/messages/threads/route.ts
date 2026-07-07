export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabaseServer'

// GET — Chat threads for the authenticated client (admin bypass, no RLS issues)
export async function GET(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // Resolve client_id from portal_users or app_metadata
    const { data: pu } = await admin
      .from('portal_users')
      .select('client_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const clientId = pu?.client_id || user.app_metadata?.client_id
    if (!clientId) return NextResponse.json({ error: 'No client linked' }, { status: 403 })

    const { data, error } = await admin
      .from('chat_threads')
      .select('id, client_id, department, name, last_message, last_message_at, thread_type, team_id, team_name, unread_count, created_at')
      .eq('client_id', clientId)
      .eq('thread_type', 'client')   // Clients only see their side, never internal threads
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
