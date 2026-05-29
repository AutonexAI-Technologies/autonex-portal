import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabaseServer'

// GET — Messages in a thread
export async function GET(req: NextRequest, { params }: { params: { threadId: string } }) {
  try {
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin.from('chat_messages')
      .select('*, message_attachments(*)').eq('thread_id', params.threadId).order('created_at')
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — Send a message
export async function POST(req: NextRequest, { params }: { params: { threadId: string } }) {
  try {
    const admin = createAdminSupabaseClient()
    const body = await req.json()
    const { data, error } = await admin.from('chat_messages').insert({
      thread_id: params.threadId,
      sender_id: body.sender_id,
      sender_name: body.sender_name,
      sender_type: 'client',
      content: body.content,
    }).select().single()
    if (error) throw error
    // Update thread timestamp
    await admin.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', params.threadId)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
