'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, User, Phone, Loader2, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: '', password: '', phone: '' })

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/portal/invite?token=${token}`)
        if (!res.ok) { setError('This invite link is invalid or expired.'); setLoading(false); return }
        const data = await res.json()
        setInvite(data)
      } catch { setError('Failed to validate invite.') }
      setLoading(false)
    }
    validate()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/portal/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create account'); setSubmitting(false); return }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch { setError('Something went wrong') }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-8 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Account Created!</h2>
          <p className="text-slate-400 text-sm">Redirecting to sign in…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-50" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-white">Autonex AI</span>
          </div>
          {invite && (
            <div>
              <p className="text-white text-sm">You've been invited to</p>
              <p className="text-blue-400 font-semibold">{invite.client_name}{invite.company ? ` — ${invite.company}` : ''}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}

          {invite && <div className="px-3 py-2 rounded-lg bg-blue-500/8 border border-blue-500/15 text-blue-400 text-xs">Setting up account for <strong>{invite.email}</strong></div>}

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" required className="input-dark w-full pl-10" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Phone (optional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className="input-dark w-full pl-10" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" required minLength={8} className="input-dark w-full pl-10 pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting || !form.name || !form.password} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
