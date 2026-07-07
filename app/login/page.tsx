'use client'
export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Loader2, Eye, EyeOff, AlertTriangle, ArrowRight } from 'lucide-react'

/* ─── Cream-bg ghost letters ────────────────────────────────────── */
function GhostBg() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-end justify-end overflow-hidden pointer-events-none select-none"
      style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(120px, 20vw, 280px)',
        lineHeight: 0.88,
        letterSpacing: '0.02em',
        color: 'rgba(26,26,26,0.045)',
        padding: '0 16px 0 0',
      }}
    >
      CLIENT
    </div>
  )
}

/* ─── Input ──────────────────────────────────────────────────────── */
function Field({
  id, type, value, onChange, placeholder, icon: Icon, right, label, autoComplete,
}: {
  id: string; type: string; value: string; onChange: (v: string) => void
  placeholder: string; icon: any; right?: React.ReactNode; label: string; autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id}
        style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.45)', marginBottom: '8px', fontFamily: "'Inter', sans-serif", transition: 'color 0.2s' }}>
        {label}
      </label>
      <div className="relative">
        <Icon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.3)', transition: 'color 0.2s' }} />
        <input
          id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', paddingLeft: '44px', paddingRight: right ? '44px' : '16px',
            height: '52px', fontFamily: "'Inter', sans-serif", fontSize: '14px',
            background: focused ? '#FFFFFF' : 'rgba(26,26,26,0.05)',
            border: focused ? '2px solid #1A1A1A' : '2px solid transparent',
            borderRadius: '4px', color: '#1A1A1A', outline: 'none',
            transition: 'all 0.2s ease',
          }}
        />
        {right && (
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
            {right}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Login Form ─────────────────────────────────────────────────── */
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
      setError('Invalid email or password. Please check your credentials.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', background: '#F0EEEA', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}
    >
      <GhostBg />

      {/* ─── Left: brand column ─── */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{ width: '40%', background: '#1A1A1A', padding: '48px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}
      >
        {/* Ghost letters on dark panel */}
        <div
          aria-hidden
          style={{
            position: 'absolute', bottom: '-10px', left: 0, right: 0,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(80px, 10vw, 160px)',
            lineHeight: 0.88, letterSpacing: '0.02em', color: 'rgba(240,238,234,0.04)',
            paddingLeft: '24px', pointerEvents: 'none', userSelect: 'none',
          }}
        >
          PORTAL
        </div>

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Autonex AI" style={{ height: '30px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', color: 'rgba(240,238,234,0.5)', letterSpacing: '0.18em', marginTop: '6px' }}>AUTONEX AI</p>
        </div>

        {/* Bottom copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ height: '1px', background: 'rgba(240,238,234,0.12)', marginBottom: '28px' }} />
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(36px,4vw,56px)', color: '#F0EEEA', letterSpacing: '0.03em', lineHeight: 0.92, marginBottom: '16px' }}>
            YOUR PROJECT.<br />YOUR PORTAL.<br />YOUR TEAM.
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(240,238,234,0.4)', lineHeight: 1.6 }}>
            Track progress, download deliverables,<br />and communicate with your team.
          </p>
        </div>
      </div>

      {/* ─── Right: form ─── */}
      <div
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', position: 'relative', zIndex: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: '380px' }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Autonex AI" style={{ height: '28px', objectFit: 'contain' }} />
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', color: '#1A1A1A', letterSpacing: '0.18em' }}>AUTONEX AI</p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.4)', marginBottom: '12px' }}>
              Client Portal
            </p>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(42px,5vw,64px)', color: '#1A1A1A', letterSpacing: '0.03em', lineHeight: 0.9, margin: 0 }}>
              WELCOME<br />BACK
            </h1>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(26,26,26,0.10)', marginBottom: '32px' }} />

          {/* Errors */}
          <AnimatePresence>
            {(errorParam === 'access_denied' || error) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: '20px' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '14px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: '4px' }}>
                  <AlertTriangle style={{ width: '15px', height: '15px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: '#dc2626', lineHeight: 1.5 }}>
                    {errorParam === 'access_denied'
                      ? 'Your account is deactivated or has been removed from this Portal.'
                      : error}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field id="portal-email" type="email" value={email} onChange={setEmail}
              placeholder="your@email.com" icon={Mail} label="Email Address" autoComplete="email" />
            <Field id="portal-password"
              type={showPw ? 'text' : 'password'} value={password} onChange={setPassword}
              placeholder="••••••••" icon={Lock} label="Password" autoComplete="current-password"
              right={
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ color: 'rgba(26,26,26,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                </button>
              }
            />

            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <a href="/forgot-password"
                style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(26,26,26,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1A1A1A')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.4)')}
              >
                Forgot password?
              </a>
            </div>

            <motion.button
              id="portal-login-btn"
              type="submit"
              disabled={loading || !email || !password}
              whileHover={{ scale: loading || !email || !password ? 1 : 1.01 }}
              whileTap={{ scale: loading || !email || !password ? 1 : 0.98 }}
              style={{
                height: '52px', width: '100%', marginTop: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                background: loading || !email || !password ? 'rgba(26,26,26,0.2)' : '#1A1A1A',
                color: loading || !email || !password ? 'rgba(26,26,26,0.4)' : '#F0EEEA',
                border: '2px solid transparent', borderRadius: '4px',
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {loading
                ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /><span>Signing in…</span></>
                : <><span>Access Portal</span><ArrowRight style={{ width: '15px', height: '15px' }} /></>
              }
            </motion.button>
          </form>

          <p style={{ marginTop: '40px', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(26,26,26,0.25)', textAlign: 'center' }}>
            PORTAL ACCESS IS INVITE-ONLY · AUTONEX AI © 2025
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0EEEA' }}>
        <Loader2 style={{ width: '24px', height: '24px', color: '#1A1A1A', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
