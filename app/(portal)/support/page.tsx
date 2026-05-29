'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion } from 'framer-motion'
import { LifeBuoy, Plus, Clock, CheckCircle2, Zap, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useRealtimeTickets } from '@/hooks/useRealtime'

const STATUS_STYLE: Record<string, { badge: string; icon: any }> = {
  open: { badge: 'badge-blue', icon: AlertCircle },
  in_progress: { badge: 'badge-yellow', icon: Zap },
  resolved: { badge: 'badge-green', icon: CheckCircle2 },
  closed: { badge: 'badge-slate', icon: CheckCircle2 },
}

export default function SupportPage() {
  const { clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data } = await supabase
      .from('support_tickets')
      .select('*, ticket_responses(count)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setTickets(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])
  useRealtimeTickets(clientId, load)

  if (userLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clientId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <LifeBuoy className="w-10 h-10 text-slate-700" />
      <p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p>
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-slate-500 text-sm mt-1">View and manage support tickets</p>
        </div>
        <Link href="/support/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <LifeBuoy className="w-10 h-10 text-slate-700" />
          <p className="text-slate-500 text-sm">No tickets yet — raise one if you need help</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t, i) => {
            const s = STATUS_STYLE[t.status] ?? STATUS_STYLE.open
            const Icon = s.icon
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card p-4 hover:border-slate-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white">{t.title}</p>
                      <span className={`badge ${s.badge}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{format(new Date(t.created_at), 'dd MMM yyyy')}
                      </span>
                      <span className="badge badge-slate">{t.urgency || 'medium'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
