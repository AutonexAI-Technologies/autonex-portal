export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET — Files for client
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const clientId = req.headers.get('x-client-id')
    if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    const { data, error } = await admin.from('files')
      .select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — Upload file metadata (file binary goes to Supabase Storage from client)
export async function POST(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient()
    const body = await req.json()
    const { data, error } = await admin.from('files').insert({
      client_id: body.client_id,
      file_name: body.file_name,
      file_type: body.file_type,
      file_size: body.file_size,
      storage_path: body.storage_path,
      uploaded_by: body.uploaded_by,
      uploaded_by_type: body.uploaded_by_type || 'client',
      category: body.category || 'general',
    }).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
