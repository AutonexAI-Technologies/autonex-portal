'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { useRealtime } from '@/hooks/useRealtime'
import { motion } from 'framer-motion'
import { ClipboardList, CheckCircle2, Circle, AlertTriangle } from 'lucide-react'

export default function OnboardingPage() {
  const { clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('sort_order')
    setTasks(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  useRealtime({
    table: 'onboarding_tasks',
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
      <ClipboardList className="w-10 h-10 text-slate-700" />
      <p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p>
    </div>
  )

  const completed = tasks.filter(t => t.status === 'completed').length
  const total = tasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const hasBlocking = tasks.some(t => t.is_blocking && t.status !== 'completed')

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Onboarding</h1>
        <p className="text-slate-500 text-sm mt-1">Complete these tasks to get started</p>
      </div>

      {/* Progress */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-white font-medium">{completed} of {total} tasks completed</p>
          <p className="text-sm font-bold text-blue-400">{progress}%</p>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
        </div>
      </div>

      {hasBlocking && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">Some tasks are blocking your project progress — please complete them to proceed</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ClipboardList className="w-10 h-10 text-slate-700" />
          <p className="text-slate-500 text-sm">No onboarding tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`glass-card p-4 flex items-start gap-3 ${t.status === 'completed' ? 'opacity-60' : ''}`}
            >
              {t.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> :
               t.is_blocking ? <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> :
               <Circle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'}`}>{t.title}</p>
                {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                {t.action_url && t.status !== 'completed' && (
                  <a href={t.action_url} target="_blank" rel="noopener" className="inline-block mt-2 text-xs text-blue-400 hover:underline">Complete this task →</a>
                )}
              </div>
              <span className={`badge ${t.status === 'completed' ? 'badge-green' : t.is_blocking ? 'badge-yellow' : 'badge-slate'}`}>
                {t.status === 'completed' ? 'done' : t.is_blocking ? 'required' : t.status}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
