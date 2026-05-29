'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePortalUser } from '@/lib/usePortalUser'
import { createClient } from '@/lib/supabase'
import { useRealtimeMilestones, useRealtimeInvoices } from '@/hooks/useRealtime'
import {
  Milestone, FileText, Receipt, MessageSquare, ClipboardList,
  ArrowRight, CheckCircle2, Clock, AlertCircle, Zap, TrendingUp, Loader2, Link2,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, href, color = 'blue' }: any) {
  const colors: Record<string, string> = {
    blue:    'text-blue-600 bg-blue-50 border-blue-200',
    violet:  'text-violet-600 bg-violet-50 border-violet-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    amber:   'text-amber-600 bg-amber-50 border-amber-200',
  }
  return (
    <Link href={href}>
      <motion.div whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(37,99,235,0.12)' }} className="glass-card p-4 cursor-pointer hover:border-blue-200 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colors[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
      </motion.div>
    </Link>
  )
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-600',
  active: 'text-blue-600',
  in_progress: 'text-blue-600',
  pending: 'text-slate-400',
  blocked: 'text-red-600',
}
const STATUS_ICON: Record<string, any> = {
  completed: CheckCircle2,
  active: Zap,
  in_progress: Clock,
  pending: Clock,
  blocked: AlertCircle,
}

export default function PortalDashboard() {
  const { user, clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const [
        { data: project },
        { data: milestones },
        { data: invoices },
        { data: messages },
        { data: tasks },
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('project_milestones').select('*').eq('client_id', clientId).order('sort_order'),
        supabase.from('invoices').select('id,status').eq('client_id', clientId),
        supabase.from('chat_threads').select('id,unread_count').eq('client_id', clientId),
        supabase.from('onboarding_tasks').select('id,status').eq('client_id', clientId),
      ])
      setData({ project, milestones: milestones ?? [], invoices: invoices ?? [], messages: messages ?? [], tasks: tasks ?? [] })
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { load() }, [load])

  // Real-time subscriptions
  useRealtimeMilestones(clientId, load)
  useRealtimeInvoices(clientId, load)

  if (userLoading || loading) {
    return (
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!clientId) {
    return <NoClientState />
  }

  const { project, milestones, invoices, messages, tasks } = data ?? {}
  const completed = milestones?.filter((m: any) => m.status === 'completed').length ?? 0
  const total = milestones?.length ?? 0
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const nextMilestone = milestones?.find((m: any) => m.status !== 'completed')
  const unpaidInvoices = invoices?.filter((i: any) => i.status !== 'paid').length ?? 0
  const unreadMessages = messages?.reduce((acc: number, t: any) => acc + (t.unread_count || 0), 0) ?? 0
  const pendingTasks = tasks?.filter((t: any) => t.status !== 'completed').length ?? 0

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-slate-500 text-sm">Welcome back,</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-0.5">{user?.name?.split(' ')[0] || 'there'} 👋</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-emerald-700 text-xs font-semibold">Project Active</span>
          </div>
        </div>
      </motion.div>

      {/* Project banner */}
      {project && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card p-5 mb-6 border-l-4 border-l-blue-600"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{project.service_type || 'Project'}</p>
              <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Progress</p>
              <p className="text-2xl font-bold text-blue-600">{progress}%</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{completed} of {total} milestones complete</span>
            {nextMilestone && (
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <Clock className="w-3 h-3" />
                Next: {nextMilestone.name}
                {nextMilestone.estimated_date && ` · ${format(new Date(nextMilestone.estimated_date), 'dd MMM')}`}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
      >
        <StatCard icon={Receipt} label="Unpaid Invoices" value={unpaidInvoices} href="/invoices" color={unpaidInvoices > 0 ? 'amber' : 'emerald'} />
        <StatCard icon={MessageSquare} label="Unread Messages" value={unreadMessages} href="/messages" color="blue" />
        <StatCard icon={ClipboardList} label="Pending Tasks" value={pendingTasks} href="/onboarding" color="violet" />
        <StatCard icon={Milestone} label="Milestones" value={`${completed}/${total}`} href="/timeline" color="emerald" />
      </motion.div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="glass-card p-4 mb-6"
      >
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'View Timeline',   href: '/timeline',    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
            { label: 'Send Message',    href: '/messages',    color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
            { label: 'View Documents',  href: '/documents',   color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
            { label: 'Raise a Ticket',  href: '/support/new', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
            { label: 'Upload File',     href: '/files',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
          ].map(a => (
            <Link key={a.href} href={a.href} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${a.color}`}>
              {a.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Milestones list */}
      {milestones && milestones.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />Project Milestones
            </h3>
            <Link href="/timeline" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {milestones.slice(0, 5).map((m: any, i: number) => {
              const Icon = STATUS_ICON[m.status] ?? Clock
              return (
                <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 glass-card hover:border-blue-200 transition-all"
                >
                  <Icon className={`w-4 h-4 shrink-0 ${STATUS_COLOR[m.status] ?? 'text-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 font-medium truncate">{m.name}</p>
                    {m.estimated_date && <p className="text-[11px] text-slate-400">{format(new Date(m.estimated_date), 'dd MMM yyyy')}</p>}
                  </div>
                  <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full bg-slate-100 ${STATUS_COLOR[m.status] ?? 'text-slate-500'}`}>{m.status}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function NoClientState() {
  const [linking, setLinking] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function linkAccount() {
    setLinking(true); setError('')
    try {
      const res = await fetch('/api/portal/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setLinking(false); return }
      setDone(true)
      setTimeout(() => window.location.reload(), 1500)
    } catch { setError('Network error'); setLinking(false) }
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
          {done ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <Link2 className="w-8 h-8 text-blue-600" />}
        </div>
        <h2 className="text-slate-900 font-bold text-lg">{done ? 'Account Linked!' : 'Account not linked'}</h2>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          {done ? 'Reloading dashboard…' : "Your portal account hasn't been linked to a client project yet."}
        </p>
        {!done && (
          <button onClick={linkAccount} disabled={linking} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-200">
            {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {linking ? 'Linking…' : 'Link My Account'}
          </button>
        )}
        {error && <p className="text-red-600 text-xs">{error}</p>}
      </div>
    </div>
  )
}
