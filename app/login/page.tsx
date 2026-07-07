'use client'
export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react'

/* ── Animated background ────────────────────────────────────────── */
function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ x: [0, 25, 0], y: [0, -30, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-15%] right-[5%] w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 25, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute bottom-[-5%] left-[-5%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)' }}
      />
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    </div>
  )
}

/* ── Input component ────────────────────────────────────────────── */
function PremiumInput({
  id, type, value, onChange, placeholder, icon: Icon, rightEl, label, autoComplete,
}: {
  id: string; type: string; value: string; onChange: (v: string) => void
  placeholder: string; icon: any; rightEl?: React.ReactNode; label: string; autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: 'rgba(148,163,184,0.6)' }}>{label}</label>
      <div className="relative flex items-center rounded-[14px] transition-all duration-200"
        style={{
          background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
          border: focused ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
        }}>
        <Icon className="absolute left-3.5 w-4 h-4 shrink-0"
          style={{ color: focused ? 'rgba(167,139,250,0.8)' : 'rgba(100,116,139,0.5)' }} />
        <input
          id={id} type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', paddingLeft: '2.75rem', paddingRight: rightEl ? '2.75rem' : '1rem',
            height: '48px', background: 'transparent', color: '#f1f5f9',
            fontSize: '14px', outline: 'none',
          }}
        />
        {rightEl && <div className="absolute right-3">{rightEl}</div>}
      </div>
    </div>
  )
}

/* ── Login Form ─────────────────────────────────────────────────── */
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
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
      setError(err.message === 'Invalid login credentials'
        ? 'Invalid email or password. Please check your credentials.'
        : err.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #060912 0%, #09101e 40%, #060912 100%)' }}>
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.12))',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 0 40px rgba(124,58,237,0.2)',
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Autonex AI" className="w-9 h-9 object-contain" />
              </div>
              <div className="absolute -inset-2 rounded-3xl blur-xl opacity-25"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(6,182,212,0.4))' }} />
            </div>
            <div>
              <h1 className="text-[15px] font-black tracking-[0.22em] uppercase" style={{ color: '#f1f5f9' }}>
                AUTONEX AI
              </h1>
              <p className="text-[10px] tracking-[0.14em] uppercase mt-0.5" style={{ color: 'rgba(148,163,184,0.4)' }}>
                Client Portal
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '24px',
            padding: '32px',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="text-[18px] font-bold text-white">Welcome back</h2>
            </div>
            <p className="text-[12px]" style={{ color: 'rgba(148,163,184,0.5)' }}>
              Sign in to view your project updates and files
            </p>
          </div>

          {/* Error alerts */}
          <AnimatePresence>
            {errorParam === 'access_denied' && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 rounded-2xl border border-red-500/25 flex gap-2.5 items-start"
                style={{ background: 'rgba(239,68,68,0.07)' }}
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-red-300 mb-0.5">Access Denied</p>
                  <p className="text-[11px] text-red-400/70 leading-relaxed">
                    Your account is deactivated or has been removed from this Portal workspace.
                  </p>
                </div>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 rounded-2xl border border-red-500/25 flex gap-2.5 items-start"
                style={{ background: 'rgba(239,68,68,0.07)' }}
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            <PremiumInput
              id="portal-email" type="email" value={email} onChange={setEmail}
              placeholder="your@email.com" icon={Mail} label="Email Address"
              autoComplete="email"
            />
            <PremiumInput
              id="portal-password"
              type={showPw ? 'text' : 'password'}
              value={password} onChange={setPassword}
              placeholder="••••••••" icon={Lock} label="Password"
              autoComplete="current-password"
              rightEl={
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="transition-colors" style={{ color: 'rgba(100,116,139,0.55)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <motion.button
              id="portal-login-btn"
              type="submit"
              disabled={loading || !email || !password}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 font-semibold transition-all"
              style={{
                height: '50px', borderRadius: '14px', fontSize: '14px', color: '#fff',
                background: loading || !email || !password
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                boxShadow: loading || !email || !password ? 'none' : '0 8px 24px rgba(124,58,237,0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px', border: 'none',
              }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in…</span></>
                : <><span>Access Portal</span><ArrowRight className="w-4 h-4" /></>
              }
            </motion.button>
          </form>

          <div className="flex items-center justify-between mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <a href="/forgot-password"
              className="text-[12px] font-medium transition-colors hover:opacity-80"
              style={{ color: '#a78bfa' }}>
              Forgot password?
            </a>
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(148,163,184,0.3)' }}>
              <ShieldCheck className="w-3 h-3" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[10px] mt-5"
          style={{ color: 'rgba(148,163,184,0.2)' }}
        >
          Portal access is invite-only · Autonex AI Technologies © 2025
        </motion.p>
      </motion.div>
    </div>
  )
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060912' }}>
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
