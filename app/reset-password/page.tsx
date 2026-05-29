'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/settings` })
    setSent(true); setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-50" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm">
        <Link href="/login" className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 mb-6"><ArrowLeft className="w-3 h-3" /> Back to login</Link>

        {sent ? (
          <div className="glass-card p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm">We've sent a reset link to <strong className="text-white">{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={submit} className="glass-card p-6 space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-white">Reset Password</h2>
              <p className="text-slate-500 text-xs mt-1">Enter your email to receive a reset link</p>
            </div>
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="input-dark w-full pl-10" />
            </div>
            <button type="submit" disabled={loading || !email} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
