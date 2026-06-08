import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

// GET /api/portal/teams — get teams assigned to the authenticated client
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // Get client record for this portal user
    const { data: client } = await admin
      .from('clients')
      .select('id, name')
      .eq('email', user.email)
      .single()

    if (!client) return NextResponse.json([])

    // Get all team assignments for this client
    const { data, error } = await admin
      .from('client_assignments')
      .select(`
        id, brief, assigned_at,
        teams (
          id, name, color,
          departments ( name ),
          team_memberships (
            id, is_lead,
            team_members ( id, name, email, roles ( name ) )
          )
        )
      `)
      .eq('client_id', client.id)
      .order('assigned_at', { ascending: false })

    if (error) return NextResponse.json([])
    return NextResponse.json({ client_id: client.id, assignments: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
