'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { useRealtime } from '@/hooks/useRealtime'
import { motion } from 'framer-motion'
import { MessageSquare, ChevronRight, Hash, Clock } from 'lucide-react'
import Link from 'next/link'

function timeAgo(dateStr: string | null) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function MessagesPage() {
  const { clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [threads, setThreads] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('client_id', clientId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    setThreads(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  useRealtime({
    table: 'chat_threads',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    onData: load,
  })

  if (userLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clientId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <MessageSquare className="w-10 h-10 text-slate-300" />
      <p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p>
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 text-sm mt-1">Chat with your project team</p>
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <MessageSquare className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 text-sm">No message channels yet — your team will set these up</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t, i) => (
            <Link key={t.id} href={`/messages/${t.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{t.name || t.department || 'General'}</p>
                  {t.last_message && <p className="text-xs text-slate-500 truncate mt-0.5">{t.last_message}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {t.last_message_at && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(t.last_message_at)}
                    </span>
                  )}
                  {(t.unread_count ?? 0) > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">{t.unread_count}</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
