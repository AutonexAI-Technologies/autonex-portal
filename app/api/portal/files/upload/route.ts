import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabaseServer'

// POST /api/portal/files/upload — client-side file upload via admin
export async function POST(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user }, error: authErr } = await serverClient.auth.getUser()

    console.log('[portal/files/upload] user:', user?.id, 'authErr:', authErr?.message)

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated — please log out and log in again' }, { status: 401 })
    }

    const admin = createAdminSupabaseClient()

    // Get client_id from portal_users (primary source)
    const { data: pu, error: puErr } = await admin
      .from('portal_users')
      .select('client_id, name')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('[portal/files/upload] portal_user:', pu, 'puErr:', puErr?.message)

    // Fallback to app_metadata (set during invite)
    const clientId = pu?.client_id || user.app_metadata?.client_id
    const uploaderName = pu?.name || user.user_metadata?.name || user.user_metadata?.full_name || 'Client'

    if (!clientId) {
      return NextResponse.json({
        error: 'Your account is not linked to a client. Please contact your account manager.',
      }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 52428800) { // 50 MB
      return NextResponse.json({ error: 'File too large. Maximum 50MB per file.' }, { status: 413 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${clientId}/client/${Date.now()}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload using admin client — bypasses ALL storage RLS
    const { error: storageErr } = await admin.storage
      .from('files')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (storageErr) {
      console.error('[portal/files/upload] storage error:', storageErr.message)
      // Common error: bucket doesn't exist
      if (storageErr.message?.includes('Bucket not found') || storageErr.message?.includes('bucket')) {
        return NextResponse.json({
          error: 'Storage not configured. Please contact support (bucket missing).',
        }, { status: 500 })
      }
      return NextResponse.json({ error: storageErr.message }, { status: 500 })
    }

    // Insert file record using admin client (bypasses RLS)
    const { data, error: dbErr } = await admin.from('files').insert({
      client_id: clientId,
      uploaded_by: user.id,
      uploader_name: uploaderName,
      uploader_type: 'client',
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || 'application/octet-stream',
      storage_path: path,
      is_deliverable: false,
    }).select().single()

    if (dbErr) {
      console.error('[portal/files/upload] db error:', dbErr.message)
      // Cleanup storage if DB insert fails
      await admin.storage.from('files').remove([path])
      return NextResponse.json({ error: dbErr.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('[portal/files/upload] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed unexpectedly' }, { status: 500 })
  }
}

// GET /api/portal/files/upload?file_id=xxx&expires=3600 — signed download URL
export async function GET(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const url = new URL(req.url)
    const fileId = url.searchParams.get('file_id')
    const expires = Number(url.searchParams.get('expires') || 3600)

    if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 })

    const { data: file } = await admin
      .from('files')
      .select('storage_path, file_name')
      .eq('id', fileId)
      .single()

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const { data: signedData, error } = await admin.storage
      .from('files')
      .createSignedUrl(file.storage_path, expires)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ url: signedData.signedUrl, file_name: file.file_name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/portal/files/upload?file_id=xxx — delete file (client-uploaded only)
export async function DELETE(req: NextRequest) {
  try {
    const serverClient = createServerSupabaseClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const fileId = new URL(req.url).searchParams.get('file_id')
    if (!fileId) return NextResponse.json({ error: 'file_id required' }, { status: 400 })

    // Get client_id — both sources
    const { data: pu } = await admin
      .from('portal_users')
      .select('client_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const clientId = pu?.client_id || user.app_metadata?.client_id

    // Verify the file belongs to this client
    const { data: file } = await admin
      .from('files')
      .select('storage_path, client_id, uploader_type')
      .eq('id', fileId)
      .single()

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    if (file.client_id !== clientId) {
      return NextResponse.json({ error: 'Not authorized to delete this file' }, { status: 403 })
    }

    // Only allow deleting client-uploaded files from portal
    if (file.uploader_type !== 'client') {
      return NextResponse.json({ error: 'Cannot delete team-uploaded files from the portal' }, { status: 403 })
    }

    await admin.storage.from('files').remove([file.storage_path])
    await admin.from('files').delete().eq('id', fileId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
