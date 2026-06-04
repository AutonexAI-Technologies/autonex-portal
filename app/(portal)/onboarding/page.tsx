'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { useRealtime } from '@/hooks/useRealtime'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, CheckCircle2, Circle, AlertTriangle, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const { clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

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
  }, [clientId]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  useRealtime({
    table: 'onboarding_tasks',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    onData: load,
  })

  const toggle = async (task: any) => {
    if (toggling) return
    setToggling(task.id)
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === task.id
        ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
        : t
    ))

    const { error } = await supabase
      .from('onboarding_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', task.id)

    if (error) {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? task : t))
    }
    setToggling(null)
  }

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
  const allDone = total > 0 && completed === total

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Onboarding</h1>
        <p className="text-slate-500 text-sm mt-1">Complete these tasks to get your project started</p>
      </div>

      {/* Progress bar */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white font-medium">{completed} of {total} tasks completed</p>
          <p className="text-sm font-bold text-blue-400">{progress}%</p>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
          />
        </div>
        {allDone && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-400 text-xs mt-3 font-medium flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> All done! Your project is fully set up 🎉
          </motion.p>
        )}
      </div>

      {hasBlocking && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">Some tasks are required before your project can proceed — please complete them</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ClipboardList className="w-10 h-10 text-slate-700" />
          <p className="text-slate-500 text-sm">No onboarding tasks yet. Your team will set these up shortly.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {tasks.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => toggle(t)}
                className={`glass-card p-4 flex items-start gap-3 cursor-pointer select-none transition-all hover:border-white/10 active:scale-[0.99] ${
                  t.status === 'completed' ? 'opacity-60' : 'hover:bg-white/5'
                }`}
              >
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                  {toggling === t.id ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : t.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : t.is_blocking ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${t.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'}`}>
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  )}
                  {t.action_url && t.status !== 'completed' && (
                    <a
                      href={t.action_url}
                      target="_blank"
                      rel="noopener"
                      onClick={e => e.stopPropagation()}
                      className="inline-block mt-2 text-xs text-blue-400 hover:underline"
                    >
                      Complete this task →
                    </a>
                  )}
                </div>

                {/* Status badge */}
                <span className={`badge shrink-0 ${
                  t.status === 'completed' ? 'badge-green' :
                  t.is_blocking ? 'badge-yellow' : 'badge-slate'
                }`}>
                  {t.status === 'completed' ? '✓ done' : t.is_blocking ? 'required' : t.status}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <p className="text-slate-600 text-xs text-center mt-8">Click any task to mark it as complete or pending</p>
    </div>
  )
}
