'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'Invalid email or password.' : err.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-200/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-cyan-200/15 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex flex-col items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_small.png"
                alt="Autonex AI"
                style={{ height: 44, objectFit: 'contain', display: 'block' }}
              />
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Client Portal</p>
            </div>
            <p className="text-slate-500 text-sm">Sign in to access your project dashboard</p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50"
        >
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-6">Enter your credentials to continue</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-600 mb-1.5 block font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="portal-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 mb-1.5 block font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="portal-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="portal-login-btn"
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(37,99,235,0.35)] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in...</span></>
              ) : (
                <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between">
            <a href="/reset-password" className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium">
              Forgot password?
            </a>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3" />
              <span>Secure &amp; encrypted</span>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          Invitation-only access · Autonex AI Technologies
        </p>
      </motion.div>
    </div>
  )
}
