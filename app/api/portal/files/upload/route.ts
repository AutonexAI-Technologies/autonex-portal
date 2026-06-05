import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabaseServer'

// POST /api/portal/files/upload — client-side file upload via admin
export async function POST(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // Get client_id from portal_users
    const { data: pu } = await admin.from('portal_users').select('client_id, name').eq('user_id', user.id).maybeSingle()
    if (!pu?.client_id) return NextResponse.json({ error: 'No client linked' }, { status: 403 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${pu.client_id}/client/${Date.now()}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload using admin client — bypasses storage RLS
    const { error: storageErr } = await admin.storage
      .from('files')
      .upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: true })

    if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 })

    // Insert file record using admin client
    const { data, error: dbErr } = await admin.from('files').insert({
      client_id: pu.client_id,
      uploaded_by: user.id,
      uploader_name: pu.name || 'Client',
      uploader_type: 'client',
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || 'application/octet-stream',
      storage_path: path,
      is_deliverable: false,
    }).select().single()

    if (dbErr) {
      await admin.storage.from('files').remove([path])
      return NextResponse.json({ error: dbErr.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/portal/files/upload?file_id=xxx — signed download URL
export async function GET(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const fileId = new URL(req.url).searchParams.get('file_id')
    const expires = Number(new URL(req.url).searchParams.get('expires') || 3600)

    if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 })

    const { data: file } = await admin.from('files').select('storage_path, file_name').eq('id', fileId).single()
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const { data: url, error } = await admin.storage.from('files').createSignedUrl(file.storage_path, expires)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ url: url.signedUrl, file_name: file.file_name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/portal/files/upload?file_id=xxx — delete file
export async function DELETE(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const fileId = new URL(req.url).searchParams.get('file_id')
    if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 })

    // Verify the file belongs to this client
    const { data: pu } = await admin.from('portal_users').select('client_id').eq('user_id', user.id).maybeSingle()
    const { data: file } = await admin.from('files').select('storage_path, client_id').eq('id', fileId).single()

    if (!file || file.client_id !== pu?.client_id) {
      return NextResponse.json({ error: 'Not authorized to delete this file' }, { status: 403 })
    }

    await admin.storage.from('files').remove([file.storage_path])
    await admin.from('files').delete().eq('id', fileId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
