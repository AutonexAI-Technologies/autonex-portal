'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Send, ArrowLeft, Loader2, Hash, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function ThreadChatPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const { user, clientId, authUser } = usePortalUser()
  const supabase = createClient()
  const [thread, setThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const optimisticIds = useRef(new Set<string>())

  const scroll = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

  const load = useCallback(async () => {
    if (!threadId) return
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from('chat_threads').select('*').eq('id', threadId).single(),
      supabase.from('chat_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true }),
    ])
    setThread(t); setMessages(m ?? []); setLoading(false); scroll()
  }, [threadId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!threadId) return
    const channel = supabase.channel(`portal-chat:${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` }, (p) => {
        const newMsg = p.new as any
        setMessages(prev => {
          // Remove any optimistic message with matching content to avoid duplicates
          const withoutOpt = prev.filter(m => !m.id.startsWith('opt-') || m.content !== newMsg.content)
          // Don't add if already present (exact ID match)
          if (withoutOpt.some(m => m.id === newMsg.id)) return withoutOpt
          return [...withoutOpt, newMsg]
        })
        scroll()
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  const send = async () => {
    if (!input.trim() || sending || !authUser) return
    const content = input.trim()
    setInput('')
    setSending(true)
    
    // Add optimistic message
    const optId = `opt-${Date.now()}`
    setMessages(prev => [...prev, { id: optId, sender_name: user?.name || 'You', sender_type: 'client', content, created_at: new Date().toISOString() }])
    scroll()
    
    await supabase.from('chat_messages').insert({
      thread_id: threadId, client_id: clientId, sender_id: authUser.id,
      sender_name: user?.name || 'Client', sender_type: 'client', content, status: 'sent',
    })
    setSending(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 bg-white">
        <Link href="/messages" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center"><Hash className="w-3.5 h-3.5 text-blue-600" /></div>
        <div><p className="text-sm font-semibold text-slate-900">{thread?.department || 'General'}</p><p className="text-[10px] text-slate-500">{messages.length} messages</p></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {messages.map((m, i) => {
          const isMe = m.sender_type === 'client'
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                {!isMe && <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><User className="w-2.5 h-2.5" />{m.sender_name} · {m.sender_role || 'Team'}</p>}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-md shadow-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'}`}>
                  {m.content}
                </div>
                <p className={`text-[9px] mt-1 ${isMe ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                  {format(new Date(m.created_at), 'h:mm a')}
                </p>
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200 shrink-0 bg-white">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Type a message…" className="input-dark flex-1" />
          <button onClick={send} disabled={!input.trim() || sending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-40 transition-colors font-medium text-sm">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
