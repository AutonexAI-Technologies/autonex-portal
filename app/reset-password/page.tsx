'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// This page is also reachable via /forgot-password redirect but we keep this
// as a standalone "send reset email" page too.
export default function ResetPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/settings`,
    })
    if (err) { setError(err.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#F0EEEA', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}
    >
      {/* Ghost text */}
      <div aria-hidden style={{ position: 'absolute', bottom: '-10px', left: 0, right: 0, textAlign: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(100px, 16vw, 220px)', lineHeight: 0.88, letterSpacing: '0.02em', color: 'rgba(26,26,26,0.04)', pointerEvents: 'none', userSelect: 'none' }}>
        RESET
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}
      >
        <Link href="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.4)', marginBottom: '40px', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1A1A1A')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.4)')}
        >
          <ArrowLeft style={{ width: '13px', height: '13px' }} />
          Back to Login
        </Link>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(26,26,26,0.06)', border: '1px solid rgba(26,26,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle2 style={{ width: '26px', height: '26px', color: '#1A1A1A' }} />
              </div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '48px', color: '#1A1A1A', letterSpacing: '0.04em', lineHeight: 0.92, marginBottom: '16px' }}>CHECK YOUR INBOX</h2>
              <p style={{ fontSize: '13px', color: 'rgba(26,26,26,0.5)', lineHeight: 1.6, marginBottom: '6px' }}>Reset link sent to</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '24px' }}>{email}</p>
              <p style={{ fontSize: '11px', color: 'rgba(26,26,26,0.35)', lineHeight: 1.6 }}>Didn't receive it? Check your spam folder. Link expires in 1 hour.</p>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.4)', marginTop: '28px', textDecoration: 'none' }}>
                <ArrowLeft style={{ width: '13px', height: '13px' }} />Return to Login
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.4)', marginBottom: '12px' }}>Client Portal</p>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(42px,6vw,64px)', color: '#1A1A1A', letterSpacing: '0.03em', lineHeight: 0.9, marginBottom: '16px' }}>FORGOT<br />PASSWORD?</h1>
              <p style={{ fontSize: '13px', color: 'rgba(26,26,26,0.5)', lineHeight: 1.6, marginBottom: '32px' }}>Enter your email and we'll send you a secure reset link.</p>
              <div style={{ height: '1px', background: 'rgba(26,26,26,0.1)', marginBottom: '32px' }} />

              {error && (
                <div style={{ padding: '12px 14px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: '4px', fontSize: '12px', color: '#dc2626', marginBottom: '16px' }}>{error}</div>
              )}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="portal-reset-email" style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.4)', marginBottom: '8px', transition: 'color 0.2s' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.3)', transition: 'color 0.2s' }} />
                    <input
                      id="portal-reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com" required autoComplete="email"
                      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                      style={{ width: '100%', paddingLeft: '44px', paddingRight: '16px', height: '52px', fontFamily: "'Inter', sans-serif", fontSize: '14px', background: focused ? '#fff' : 'rgba(26,26,26,0.05)', border: focused ? '2px solid #1A1A1A' : '2px solid transparent', borderRadius: '4px', color: '#1A1A1A', outline: 'none', transition: 'all 0.2s' }}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || !email}
                  style={{ height: '52px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: loading || !email ? 'rgba(26,26,26,0.2)' : '#1A1A1A', color: loading || !email ? 'rgba(26,26,26,0.4)' : '#F0EEEA', border: 'none', borderRadius: '4px', cursor: loading || !email ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                  {loading ? <><Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} /><span>Sending…</span></> : <span>Send Reset Link →</span>}
                </button>
              </form>
              <p style={{ marginTop: '32px', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(26,26,26,0.25)', textAlign: 'center' }}>INVITE-ONLY PORTAL · AUTONEX AI TECHNOLOGIES</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
