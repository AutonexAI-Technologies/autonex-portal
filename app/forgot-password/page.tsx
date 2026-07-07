'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/settings`,
    })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#F0EEEA', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Subtle noise / texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Big ghost letters */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(120px,18vw,260px)', letterSpacing: '-0.01em', color: 'rgba(26,26,26,0.04)', lineHeight: 1 }}
      >
        RESET
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 mb-8 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60"
          style={{ color: '#1A1A1A', letterSpacing: '0.12em' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="text-center py-10"
              style={{ background: '#1A1A1A', borderRadius: '4px', padding: '48px 40px' }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <CheckCircle2 className="w-7 h-7" style={{ color: '#F0EEEA' }} />
              </div>
              <h2
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', color: '#F0EEEA', letterSpacing: '0.05em', lineHeight: 1, marginBottom: '16px' }}
              >
                CHECK YOUR INBOX
              </h2>
              <p style={{ color: 'rgba(240,238,234,0.55)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
                We sent a reset link to
              </p>
              <p style={{ color: '#F0EEEA', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
                {email}
              </p>
              <p style={{ color: 'rgba(240,238,234,0.35)', fontSize: '12px' }}>
                Didn't receive it? Check your spam folder. Link expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-8 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60"
                style={{ color: '#F0EEEA', letterSpacing: '0.12em' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Login
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="mb-8">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'rgba(26,26,26,0.4)', letterSpacing: '0.15em' }}
                >
                  Password Recovery
                </p>
                <h1
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px,8vw,72px)', color: '#1A1A1A', letterSpacing: '0.02em', lineHeight: 0.92, marginBottom: '20px' }}
                >
                  FORGOT<br />PASSWORD?
                </h1>
                <p style={{ color: 'rgba(26,26,26,0.55)', fontSize: '14px', lineHeight: 1.6 }}>
                  Enter your portal email address and we'll send you a secure reset link.
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(26,26,26,0.12)', marginBottom: '32px' }} />

              <form onSubmit={submit} className="space-y-4">
                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="px-4 py-3 text-sm"
                      style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '4px', color: '#dc2626' }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email input */}
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: 'rgba(26,26,26,0.5)', letterSpacing: '0.12em' }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.35)' }}
                    />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      style={{
                        width: '100%',
                        paddingLeft: '2.75rem',
                        paddingRight: '1rem',
                        height: '52px',
                        background: focused ? 'rgba(255,255,255,0.8)' : 'rgba(26,26,26,0.05)',
                        border: focused ? '2px solid #1A1A1A' : '2px solid transparent',
                        borderRadius: '4px',
                        color: '#1A1A1A',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || !email}
                  whileHover={{ scale: loading || !email ? 1 : 1.01 }}
                  whileTap={{ scale: loading || !email ? 1 : 0.98 }}
                  style={{
                    width: '100%',
                    height: '52px',
                    background: loading || !email ? 'rgba(26,26,26,0.3)' : '#1A1A1A',
                    color: '#F0EEEA',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    border: '2px solid transparent',
                    borderRadius: '4px',
                    cursor: loading || !email ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending…</span></>
                    : <span>Send Reset Link →</span>
                  }
                </motion.button>
              </form>

              <p
                className="text-center mt-8 text-xs"
                style={{ color: 'rgba(26,26,26,0.3)', letterSpacing: '0.05em' }}
              >
                Invitation-only portal · Autonex AI Technologies
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
