import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET /api/portal/files/signed-url?file_id=xxx
export async function GET(req: NextRequest) {
  try {
    const fileId = new URL(req.url).searchParams.get('file_id')
    if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 })
    const admin = createAdminSupabaseClient()
    const { data: file } = await admin.from('files').select('storage_path, file_name').eq('id', fileId).single()
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data } = await admin.storage.from('files').createSignedUrl(file.storage_path, 60)
    if (!data?.signedUrl) return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
    return NextResponse.json({ url: data.signedUrl, file_name: file.file_name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
