'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewTicketPage() {
  const { clientId, user, authUser } = usePortalUser()
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({ title: '', description: '', ticket_type: 'general', urgency: 'medium' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !authUser) return
    setSubmitting(true)
    await supabase.from('support_tickets').insert({
      client_id: clientId, raised_by: authUser.id, raiser_name: user?.name || 'Client', ...form,
    })
    router.push('/support')
  }

  return (
    <div className="px-6 py-8 max-w-xl mx-auto">
      <Link href="/support" className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 mb-6"><ArrowLeft className="w-3 h-3" /> Back to tickets</Link>
      <h1 className="text-2xl font-bold text-white mb-6">Raise a Ticket</h1>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="glass-card p-6 space-y-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Subject</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Brief summary of the issue" className="input-dark w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4} placeholder="Describe the issue in detail..." className="input-dark w-full resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Type</label>
            <select value={form.ticket_type} onChange={e => setForm(f => ({ ...f, ticket_type: e.target.value }))} className="input-dark w-full">
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="design">Design</option>
              <option value="content">Content</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Urgency</label>
            <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))} className="input-dark w-full">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={submitting || !form.title || !form.description} className="btn-primary w-full flex items-center justify-center gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /><span>Submit Ticket</span></>}
        </button>
      </motion.form>
    </div>
  )
}
