import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabaseServer'

// GET /api/portal/invoices — list invoices for the logged-in client
export async function GET(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // Get client_id
    const { data: pu } = await admin
      .from('portal_users')
      .select('client_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const clientId = pu?.client_id || user.app_metadata?.client_id
    if (!clientId) return NextResponse.json({ error: 'No client linked' }, { status: 403 })

    const { data, error } = await admin
      .from('invoices')
      .select('id, invoice_number, total, gst_amount, gst_enabled, status, due_date, created_at, is_retainer_invoice, client_id')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
