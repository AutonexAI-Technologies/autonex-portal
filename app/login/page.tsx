'use client'
export const dynamic = 'force-dynamic'

import { useState, Suspense, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Loader2, Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react'

/* ── Animated floating particles ─────────────────────────── */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${[120, 80, 200, 60, 100, 140][i]}px`,
            height: `${[120, 80, 200, 60, 100, 140][i]}px`,
            left: `${[10, 65, 80, 20, 50, 35][i]}%`,
            top: `${[15, 60, 25, 75, 40, 85][i]}%`,
            background: `radial-gradient(circle, rgba(26,26,26,${[0.04, 0.03, 0.025, 0.035, 0.02, 0.03][i]}) 0%, transparent 70%)`,
          }}
          animate={{
            x: [0, [15, -10, 20, -15, 12, -8][i], 0],
            y: [0, [-20, 15, -10, 18, -12, 14][i], 0],
          }}
          transition={{
            duration: [12, 16, 20, 14, 18, 10][i],
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.5,
          }}
        />
      ))}
    </div>
  )
}

/* ── Input field ──────────────────────────────────────────── */
function Field({
  id, type, value, onChange, placeholder, icon: Icon, right, label, autoComplete,
}: {
  id: string; type: string; value: string; onChange: (v: string) => void
  placeholder: string; icon: any; right?: React.ReactNode; label: string; autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} style={{
        display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.4)',
        marginBottom: '8px', fontFamily: "'Inter', sans-serif", transition: 'color 0.2s',
      }}>{label}</label>
      <motion.div
        style={{
          position: 'relative',
          border: focused ? '2px solid #1A1A1A' : '2px solid rgba(26,26,26,0.12)',
          borderRadius: '6px',
          background: focused ? '#ffffff' : 'rgba(26,26,26,0.04)',
          transition: 'all 0.2s ease',
        }}
        animate={{ scale: focused ? 1.005 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          width: '15px', height: '15px',
          color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.3)',
          transition: 'color 0.2s', flexShrink: 0,
        }} />
        <input
          id={id} type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', paddingLeft: '44px', paddingRight: right ? '44px' : '16px',
            height: '52px', background: 'transparent',
            border: 'none', outline: 'none',
            color: '#1A1A1A', fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
          }}
        />
        {right && (
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
            {right}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* ── Login form ──────────────────────────────────────────── */
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
  const canSubmit = email.trim().length > 0 && password.length > 0

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (err) {
      const msg =
        err.message.toLowerCase().includes('invalid') ? 'Incorrect email or password. Please try again.' :
        err.message.toLowerCase().includes('email not confirmed') ? 'Please verify your email before signing in.' :
        err.message
      setError(msg)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F0EEEA', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <Particles />

      {/* ── Left dark brand panel ─── */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{ width: '38%', background: '#1A1A1A', padding: '44px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}
      >
        {/* Ghost type background */}
        <div aria-hidden style={{
          position: 'absolute', bottom: '-12px', left: 0, right: 0,
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(72px, 9vw, 140px)',
          lineHeight: 0.85, letterSpacing: '0.03em', color: 'rgba(240,238,234,0.045)',
          paddingLeft: '20px', pointerEvents: 'none', userSelect: 'none',
        }}>
          CLIENT<br />PORTAL
        </div>

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Autonex AI" style={{ height: '40px', objectFit: 'contain', filter: 'brightness(0) invert(0.9)' }} />
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', color: 'rgba(240,238,234,0.4)', letterSpacing: '0.22em', marginTop: '8px' }}>AUTONEX AI</p>
        </div>

        {/* Bottom */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ height: '1px', background: 'rgba(240,238,234,0.1)', marginBottom: '24px' }} />
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(32px,3.5vw,48px)', color: '#F0EEEA', letterSpacing: '0.03em', lineHeight: 0.95, marginBottom: '14px' }}>
            YOUR PROJECT.<br />YOUR TEAM.<br />YOUR PORTAL.
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(240,238,234,0.38)', lineHeight: 1.7 }}>
            Track progress, review deliverables,<br />and stay connected with your team.
          </p>
          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck style={{ width: '12px', height: '12px', color: 'rgba(240,238,234,0.3)' }} />
            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,238,234,0.3)' }}>Invite-Only Access</span>
          </div>
        </div>
      </div>

      {/* ── Right cream form panel ─── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: '360px' }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Autonex AI" style={{ height: '32px', objectFit: 'contain' }} />
            <div>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px', color: '#1A1A1A', letterSpacing: '0.2em' }}>AUTONEX AI</p>
              <p style={{ fontSize: '10px', color: 'rgba(26,26,26,0.4)', letterSpacing: '0.08em' }}>Client Portal</p>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.38)', marginBottom: '10px' }}>
              Client Portal
            </p>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(44px,5vw,60px)', color: '#1A1A1A', letterSpacing: '0.03em', lineHeight: 0.92, margin: 0 }}>
              SIGN IN TO<br />YOUR PORTAL
            </h1>
          </div>

          <div style={{ height: '1px', background: 'rgba(26,26,26,0.1)', marginBottom: '28px' }} />

          {/* Error */}
          <AnimatePresence>
            {(errorParam === 'access_denied' || error) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: '20px' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '13px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: '6px' }}>
                  <AlertTriangle style={{ width: '14px', height: '14px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: '#dc2626', lineHeight: 1.5, margin: 0 }}>
                    {errorParam === 'access_denied'
                      ? 'Your account has been deactivated or removed from this portal.'
                      : error}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field id="portal-email" type="email" value={email} onChange={setEmail}
              placeholder="your@email.com" icon={Mail} label="Email" autoComplete="email" />
            <Field
              id="portal-password"
              type={showPw ? 'text' : 'password'}
              value={password} onChange={setPassword}
              placeholder="Your password" icon={Lock} label="Password" autoComplete="current-password"
              right={
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ color: 'rgba(26,26,26,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                </button>
              }
            />

            <div style={{ textAlign: 'right' }}>
              <a href="/forgot-password" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(26,26,26,0.4)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1A1A1A')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.4)')}>
                Forgot password?
              </a>
            </div>

            <motion.button
              id="portal-login-btn"
              type="submit"
              disabled={!canSubmit || loading}
              whileHover={{ scale: !canSubmit || loading ? 1 : 1.015 }}
              whileTap={{ scale: !canSubmit || loading ? 1 : 0.985 }}
              style={{
                height: '52px', width: '100%', marginTop: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                background: !canSubmit || loading ? 'rgba(26,26,26,0.18)' : '#1A1A1A',
                color: !canSubmit || loading ? 'rgba(26,26,26,0.4)' : '#F0EEEA',
                border: 'none', borderRadius: '6px',
                cursor: !canSubmit || loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                boxShadow: canSubmit && !loading ? '0 4px 20px rgba(26,26,26,0.2)' : 'none',
              }}
            >
              {loading
                ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /><span>Signing in…</span></>
                : <><span>Access Portal</span><ArrowRight style={{ width: '15px', height: '15px' }} /></>}
            </motion.button>
          </form>

          <p style={{ marginTop: '36px', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(26,26,26,0.22)', textAlign: 'center' }}>
            Invite-only · Autonex AI Technologies © 2025
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
