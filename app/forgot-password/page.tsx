'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    setError('')

    // Create fresh client directly here — avoids any SSR issues
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/settings` }
    )

    if (err) {
      // Surface the error but don't block the UX — Supabase often returns errors
      // even when the email was sent (security feature). We show success anyway.
      console.error('[forgot-password]', err.message)
    }
    // Always show success (security best practice — don't reveal if email exists)
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F0EEEA', fontFamily: "'Inter', sans-serif", padding: '40px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ghost text watermark */}
      <div aria-hidden style={{
        position: 'absolute', bottom: '-8px', right: '0', left: '0', textAlign: 'center',
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(80px,14vw,180px)',
        lineHeight: 0.88, color: 'rgba(26,26,26,0.035)', pointerEvents: 'none', userSelect: 'none',
        letterSpacing: '0.04em',
      }}>
        RESET
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}
      >
        {/* Back link */}
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(26,26,26,0.4)', textDecoration: 'none', marginBottom: '48px',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1A1A1A')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.4)')}
        >
          <ArrowLeft style={{ width: '13px', height: '13px' }} />
          Back to Login
        </Link>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Autonex AI" style={{ height: '36px', objectFit: 'contain' }} />
          <div>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px', color: '#1A1A1A', letterSpacing: '0.2em', lineHeight: 1 }}>AUTONEX AI</p>
            <p style={{ fontSize: '10px', color: 'rgba(26,26,26,0.38)', letterSpacing: '0.08em', marginTop: '3px' }}>Client Portal</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Success state */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
                }}>
                  <CheckCircle2 style={{ width: '24px', height: '24px', color: '#15803D' }} />
                </div>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.38)', marginBottom: '10px' }}>Email Sent</p>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(36px,5vw,52px)', color: '#1A1A1A', letterSpacing: '0.03em', lineHeight: 0.9, marginBottom: '20px' }}>
                  CHECK YOUR<br />INBOX
                </h2>
                <div style={{ height: '1px', background: 'rgba(26,26,26,0.1)', width: '100%', marginBottom: '20px' }} />
                <p style={{ fontSize: '13px', color: 'rgba(26,26,26,0.5)', lineHeight: 1.65 }}>
                  We sent a password reset link to <strong style={{ color: '#1A1A1A', fontWeight: 600 }}>{email}</strong>. Check your inbox and spam folder.
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(26,26,26,0.35)', lineHeight: 1.6, marginTop: '10px' }}>
                  The link expires in 1 hour. If you don't receive it within a few minutes, check your spam folder.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  style={{
                    marginTop: '28px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'rgba(26,26,26,0.4)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#1A1A1A')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.4)')}
                >
                  ← Try a different email
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Form */}
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.38)', marginBottom: '10px' }}>
                Password Recovery
              </p>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px,6vw,56px)', color: '#1A1A1A', letterSpacing: '0.03em', lineHeight: 0.9, marginBottom: '16px' }}>
                FORGOT YOUR<br />PASSWORD?
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(26,26,26,0.48)', lineHeight: 1.65, marginBottom: '32px' }}>
                Enter your portal email and we'll send you a secure reset link.
              </p>

              <div style={{ height: '1px', background: 'rgba(26,26,26,0.1)', marginBottom: '28px' }} />

              {error && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: '6px', marginBottom: '16px' }}>
                  <AlertTriangle style={{ width: '14px', height: '14px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: '#dc2626', lineHeight: 1.5, margin: 0 }}>{error}</p>
                </div>
              )}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="portal-forgot-email" style={{
                    display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.4)',
                    marginBottom: '8px', transition: 'color 0.2s',
                  }}>
                    Email Address
                  </label>
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
                    <Mail style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      width: '15px', height: '15px',
                      color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.3)', transition: 'color 0.2s',
                    }} />
                    <input
                      id="portal-forgot-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      style={{
                        width: '100%', paddingLeft: '44px', paddingRight: '16px',
                        height: '52px', background: 'transparent', border: 'none', outline: 'none',
                        color: '#1A1A1A', fontSize: '14px', fontFamily: "'Inter', sans-serif",
                      }}
                    />
                  </motion.div>
                </div>

                <motion.button
                  type="submit"
                  disabled={!email.trim() || loading}
                  whileHover={{ scale: !email.trim() || loading ? 1 : 1.015 }}
                  whileTap={{ scale: !email.trim() || loading ? 1 : 0.985 }}
                  style={{
                    height: '52px', width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    background: !email.trim() || loading ? 'rgba(26,26,26,0.18)' : '#1A1A1A',
                    color: !email.trim() || loading ? 'rgba(26,26,26,0.4)' : '#F0EEEA',
                    border: 'none', borderRadius: '6px',
                    cursor: !email.trim() || loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                    boxShadow: email.trim() && !loading ? '0 4px 20px rgba(26,26,26,0.18)' : 'none',
                  }}
                >
                  {loading
                    ? <><Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} /><span>Sending…</span></>
                    : <span>Send Reset Link →</span>}
                </motion.button>
              </form>

              <p style={{ marginTop: '32px', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(26,26,26,0.25)', textAlign: 'center' }}>
                Invite-only portal · Autonex AI Technologies
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
