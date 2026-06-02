'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { useRealtimeMilestones } from '@/hooks/useRealtime'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Zap, AlertCircle, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'

const STATUS: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  completed:  { color: 'text-emerald-400', bg: 'bg-emerald-400', icon: CheckCircle2, label: 'Completed' },
  active:     { color: 'text-blue-400',    bg: 'bg-blue-400',    icon: Zap,          label: 'In Progress' },
  in_progress:{ color: 'text-blue-400',    bg: 'bg-blue-400',    icon: Zap,          label: 'In Progress' },
  pending:    { color: 'text-slate-500',   bg: 'bg-slate-700',   icon: Clock,        label: 'Pending' },
  blocked:    { color: 'text-red-400',     bg: 'bg-red-500',     icon: AlertCircle,  label: 'Blocked' },
}

export default function TimelinePage() {
  const { clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('client_id', clientId)
      .order('sort_order', { ascending: true })
    setMilestones(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])
  useRealtimeMilestones(clientId, load)

  if (userLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clientId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <CalendarDays className="w-10 h-10 text-slate-700" />
      <p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p>
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Project Timeline</h1>
        <p className="text-slate-500 text-sm mt-1">Track your project milestones and progress</p>
      </div>

      {milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CalendarDays className="w-10 h-10 text-slate-700" />
          <p className="text-slate-500 text-sm">No milestones yet — your team will add them soon</p>
        </div>
      ) : (
        <div className="relative">
          {milestones.map((m, i) => {
            const s = STATUS[m.status] ?? STATUS.pending
            const Icon = s.icon
            const isLast = i === milestones.length - 1
            return (
              <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex gap-4">
                {/* Timeline spine */}
                <div className="flex flex-col items-center w-8 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.status === 'active' || m.status === 'in_progress' ? 'ring-4 ring-blue-500/20' : ''} ${m.status === 'completed' ? 'bg-emerald-500/10' : 'bg-white'} border border-slate-200`}>
                    <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-white/6 my-2" />}
                </div>
                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="glass-card p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-white">{m.name}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/5 ${s.color}`}>{s.label}</span>
                    </div>
                    {m.description && <p className="text-xs text-slate-400 mb-2">{m.description}</p>}
                    {m.notes && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-[11px] text-slate-500 italic">"{m.notes}"</p>
                      </div>
                    )}
                    {m.estimated_date && (
                      <div className="flex items-center gap-1 mt-2">
                        <CalendarDays className="w-3 h-3 text-slate-600" />
                        <span className="text-[11px] text-slate-600">{format(new Date(m.estimated_date), 'dd MMM yyyy')}</span>
                      </div>
                    )}
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
