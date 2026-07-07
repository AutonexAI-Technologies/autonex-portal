'use client'
export const dynamic = 'force-dynamic'

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
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/settings` })
    setSent(true); setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[360px] bg-blue-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-200/20 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        <Link href="/login" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>

        {/* Official Autonex AI Logo */}
        <div className="text-center mb-6">
          <div style={{ background: '#1A3566', borderRadius: '14px', padding: '14px 32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Autonex AI"
              style={{ height: 48, objectFit: 'contain', display: 'block' }}
            />
          </div>
          <p className="text-slate-500 text-sm">Reset your portal password</p>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-slate-500 text-sm">
              We've sent a reset link to <strong className="text-slate-800">{email}</strong>
            </p>
            <p className="text-slate-400 text-xs mt-3">Didn't receive it? Check your spam folder.</p>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 space-y-5"
          >
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Forgot password?</h2>
              <p className="text-slate-500 text-sm">Enter your email to receive a reset link</p>
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link →'}
            </button>
          </motion.form>
        )}

        <p className="text-center text-slate-400 text-xs mt-6">
          Invitation-only access · Autonex AI Technologies
        </p>
      </motion.div>
    </div>
  )
}
