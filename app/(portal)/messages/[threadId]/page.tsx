'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, Loader2, Hash, User, Paperclip, FileIcon } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

function isImage(mime?: string) { return mime?.startsWith('image/') }

export default function ThreadChatPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const { user, clientId, authUser } = usePortalUser()
  const supabase = createClient()
  const [thread, setThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const presenceChannel = useRef<any>(null)

  const scroll = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

  const load = useCallback(async () => {
    if (!threadId) return
    try {
      const [threadRes, msgRes] = await Promise.all([
        fetch('/api/portal/messages/threads'),
        fetch(`/api/portal/messages/${threadId}/messages`),
      ])
      if (threadRes.ok) {
        const allThreads = await threadRes.json()
        const found = Array.isArray(allThreads) ? allThreads.find((t: any) => t.id === threadId) : null
        setThread(found || { id: threadId, department: 'General', name: 'General' })
      }
      if (msgRes.ok) {
        const msgs = await msgRes.json()
        setMessages(Array.isArray(msgs) ? msgs : [])
      }
    } catch {}
    setLoading(false)
    scroll()

    // Mark thread as read
    if (clientId) {
      await supabase.from('chat_threads')
        .update({ unread_count: 0 })
        .eq('id', threadId)
        .eq('client_id', clientId)
    }
  }, [threadId, clientId])

  useEffect(() => { load() }, [load])

  // Real-time new messages
  useEffect(() => {
    if (!threadId) return
    const channel = supabase.channel(`portal-chat:${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `thread_id=eq.${threadId}`
      }, (p) => {
        const newMsg = p.new as any
        setMessages(prev => {
          const withoutOpt = prev.filter(m => !m.id.startsWith('opt-') || m.content !== newMsg.content)
          if (withoutOpt.some(m => m.id === newMsg.id)) return withoutOpt
          return [...withoutOpt, newMsg]
        })
        scroll()
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  // Typing indicator via Presence
  useEffect(() => {
    if (!threadId || !authUser) return
    const ch = supabase.channel(`portal-presence-${threadId}`, { config: { presence: { key: authUser.id } } })
    presenceChannel.current = ch
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, any[]>
      const typers = Object.values(state)
        .flat()
        .filter((p: any) => p.isTyping && p.userId !== authUser.id)
        .map((p: any) => p.name as string)
      setTypingUsers(typers)
    }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [threadId, authUser])

  const setTyping = useCallback((typing: boolean) => {
    presenceChannel.current?.track({ name: user?.name || 'Client', userId: authUser?.id, isTyping: typing })
  }, [user, authUser])

  const send = async (content?: string, attachmentUrl?: string, attachmentName?: string, attachmentType?: string) => {
    const text = (content ?? input).trim()
    if (!text && !attachmentUrl) return
    if (sending || !authUser) return
    setInput('')
    setSending(true)
    setTyping(false)

    const optId = `opt-${Date.now()}`
    setMessages(prev => [...prev, {
      id: optId, sender_name: user?.name || 'You',
      sender_type: 'client', content: text, created_at: new Date().toISOString(),
      attachment_url: attachmentUrl, attachment_name: attachmentName, attachment_type: attachmentType,
    }])
    scroll()

    try {
      await fetch(`/api/portal/messages/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: authUser.id,
          sender_name: user?.name || 'Client',
          content: text,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_type: attachmentType,
        }),
      })
    } catch {
      await supabase.from('chat_messages').insert({
        thread_id: threadId, client_id: clientId, sender_id: authUser.id,
        sender_name: user?.name || 'Client', sender_type: 'client',
        content: text, status: 'sent',
        attachment_url: attachmentUrl, attachment_name: attachmentName, attachment_type: attachmentType,
      })
    }
    setSending(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !authUser) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `portal-messages/${threadId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('files').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(path)
      await send(`📎 ${file.name}`, publicUrl, file.name, file.type)
    } catch (err) { console.error('[portal file upload]', err) }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const teamName = thread?.team_name || thread?.name || thread?.department || 'General'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 bg-white">
        <Link href="/messages" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
          <Hash className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{teamName}</p>
          <p className="text-[10px] text-slate-500">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Hash className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-sm">No messages yet — say hello!</p>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.sender_type === 'client'
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                {!isMe && (
                  <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    {m.sender_name} · {m.sender_role || 'Team'}
                  </p>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isMe
                  ? 'bg-blue-600 text-white rounded-br-md shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'}`}>
                  {/* Attachment */}
                  {m.attachment_url && isImage(m.attachment_type) && (
                    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                      <img src={m.attachment_url} alt={m.attachment_name} className="max-w-[200px] rounded-xl" />
                    </a>
                  )}
                  {m.attachment_url && !isImage(m.attachment_type) && (
                    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-xl ${isMe ? 'bg-blue-700/50' : 'bg-slate-50 border border-slate-200'}`}>
                      <FileIcon className="w-4 h-4 shrink-0" />
                      <span className="text-xs truncate max-w-[140px]">{m.attachment_name}</span>
                    </a>
                  )}
                  {m.content && m.content !== `📎 ${m.attachment_name}` && m.content}
                </div>
                <p className={`text-[9px] mt-1 ${isMe ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                  {format(new Date(m.created_at), 'h:mm a')}
                </p>
              </div>
            </motion.div>
          )
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                ))}
              </div>
              <span className="text-[10px] text-slate-400">Team is typing…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200 shrink-0 bg-white">
        {uploading && (
          <div className="mb-2 flex items-center gap-2 text-xs text-blue-500 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0">
            <Paperclip className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setTyping(e.target.value.length > 0) }}
            onBlur={() => setTyping(false)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type a message…"
            className="flex-1 h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button onClick={() => send()} disabled={!input.trim() || sending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-40 transition-colors font-medium text-sm">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
