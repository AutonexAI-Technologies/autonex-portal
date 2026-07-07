'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { usePortalUser } from '@/lib/usePortalUser'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, ChevronRight, Clock, Users } from 'lucide-react'
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
  const { loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [threads, setThreads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portal/messages/threads')
      if (res.ok) {
        const data = await res.json()
        setThreads(Array.isArray(data) ? data : [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!userLoading) load()
  }, [userLoading, load])

  // Real-time thread updates (replaces 15s polling)
  useEffect(() => {
    const channel = supabase
      .channel('portal-thread-list')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_threads',
      }, () => {
        load() // reload thread list when any thread is updated
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
      }, () => {
        load()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, load])

  const totalUnread = threads.reduce((a, t) => a + (t.unread_count ?? 0), 0)

  if (userLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold animate-pulse">
                {totalUnread}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Chat with your project teams</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
          <Users className="w-3 h-3" />
          {threads.length} active {threads.length === 1 ? 'channel' : 'channels'}
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-slate-600 font-semibold">No message channels yet</p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Your team will set up communication channels when your project kicks off.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {threads.map((t, i) => {
              const unread = t.unread_count ?? 0
              const teamName = t.team_name || t.name || t.department || 'General'
              return (
                <Link key={t.id} href={`/messages/${t.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      unread > 0
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      unread > 0 ? 'bg-blue-500 text-white' : 'bg-blue-50 border border-blue-200 text-blue-600'
                    }`}>
                      {teamName.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-800'}`}>
                        {teamName}
                      </p>
                      {t.last_message ? (
                        <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                          {t.last_message}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-300 italic mt-0.5">Start the conversation…</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {t.last_message_at && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(t.last_message_at)}
                        </span>
                      )}
                      {unread > 0 && (
                        <span className="min-w-[20px] h-5 px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </motion.div>
                </Link>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
