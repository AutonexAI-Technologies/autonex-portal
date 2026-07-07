export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

/**
 * GET /api/portal/files/download?file_id=xxx
 * Proxies the file download — Supabase URL never exposed to the browser.
 */
export async function GET(req: NextRequest) {
  try {
    const fileId = new URL(req.url).searchParams.get('file_id')
    if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 })

    const admin = createAdminSupabaseClient()
    const { data: file } = await admin
      .from('files')
      .select('storage_path, file_name, file_type')
      .eq('id', fileId)
      .single()

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    // Short-lived URL (10 seconds — just enough to fetch)
    const { data: signed, error: signErr } = await admin.storage
      .from('files')
      .createSignedUrl(file.storage_path, 10)

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
    }

    const fileRes = await fetch(signed.signedUrl)
    if (!fileRes.ok) return NextResponse.json({ error: 'Storage fetch failed' }, { status: 502 })

    const safeFilename = encodeURIComponent(file.file_name)
    return new NextResponse(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': file.file_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.file_name}"; filename*=UTF-8''${safeFilename}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[GET /api/portal/files/download]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
