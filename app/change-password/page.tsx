'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

function ChangePasswordForm() {
  const router = useRouter()
  const supabase = createClient()
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  // When landing here from a recovery link, Supabase sets the session
  // via the URL hash fragment. We wait for the onAuthStateChange to confirm it.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
    })
    // Also check if there's already a session (arrived via our server-side redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPw !== confirm) { setError('Passwords do not match'); return }
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPw })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  if (!sessionReady) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '48px 0' }}>
        <Loader2 style={{ width: '24px', height: '24px', color: '#1A1A1A', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '13px', color: 'rgba(26,26,26,0.5)' }}>Verifying your reset link…</p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 style={{ width: '26px', height: '26px', color: '#15803D' }} />
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '48px', color: '#1A1A1A', letterSpacing: '0.03em', lineHeight: 0.9, marginBottom: '12px' }}>PASSWORD UPDATED</h2>
          <p style={{ fontSize: '13px', color: 'rgba(26,26,26,0.5)' }}>Redirecting you to login…</p>
        </motion.div>
      ) : (
        <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: '6px' }}>
                  <AlertTriangle style={{ width: '14px', height: '14px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {[
            { id: 'portal-new-pw', label: 'New Password', val: newPw, set: setNewPw, ph: 'Min 8 characters' },
            { id: 'portal-confirm-pw', label: 'Confirm Password', val: confirm, set: setConfirm, ph: 'Repeat your password' },
          ].map(({ id, label, val, set, ph }) => {
            const [focused, setFocused] = useState(false)
            return (
              <div key={id}>
                <label htmlFor={id} style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.4)', marginBottom: '8px', fontFamily: "'Inter',sans-serif", transition: 'color 0.2s' }}>{label}</label>
                <motion.div style={{ position: 'relative', border: focused ? '2px solid #1A1A1A' : '2px solid rgba(26,26,26,0.12)', borderRadius: '6px', background: focused ? '#fff' : 'rgba(26,26,26,0.04)', transition: 'all 0.2s' }} animate={{ scale: focused ? 1.005 : 1 }} transition={{ duration: 0.2 }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: focused ? '#1A1A1A' : 'rgba(26,26,26,0.3)', transition: 'color 0.2s' }} />
                  <input id={id} type={showPw ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)} placeholder={ph} required minLength={8} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{ width: '100%', paddingLeft: '44px', paddingRight: id === 'portal-new-pw' ? '44px' : '16px', height: '52px', background: 'transparent', border: 'none', outline: 'none', color: '#1A1A1A', fontSize: '14px', fontFamily: "'Inter',sans-serif" }} />
                  {id === 'portal-new-pw' && (
                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,26,26,0.35)', display: 'flex', alignItems: 'center' }}>
                      {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                    </button>
                  )}
                </motion.div>
              </div>
            )
          })}

          <motion.button type="submit" disabled={!newPw || !confirm || loading}
            whileHover={{ scale: !newPw || !confirm || loading ? 1 : 1.015 }}
            whileTap={{ scale: !newPw || !confirm || loading ? 1 : 0.985 }}
            style={{ height: '52px', width: '100%', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: "'Inter',sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: !newPw || !confirm || loading ? 'rgba(26,26,26,0.18)' : '#1A1A1A', color: !newPw || !confirm || loading ? 'rgba(26,26,26,0.4)' : '#F0EEEA', border: 'none', borderRadius: '6px', cursor: !newPw || !confirm || loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: newPw && confirm && !loading ? '0 4px 20px rgba(26,26,26,0.18)' : 'none' }}>
            {loading ? <><Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} /><span>Updating…</span></> : <><span>Set New Password</span><ArrowRight style={{ width: '15px', height: '15px' }} /></>}
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}

export default function ChangePasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0EEEA', fontFamily: "'Inter',sans-serif", padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Ghost text */}
      <div aria-hidden style={{ position: 'absolute', bottom: '-8px', left: 0, right: 0, textAlign: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(80px,14vw,180px)', lineHeight: 0.88, color: 'rgba(26,26,26,0.035)', pointerEvents: 'none', userSelect: 'none', letterSpacing: '0.04em' }}>
        NEW PASS
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Autonex AI" style={{ height: '36px', objectFit: 'contain' }} />
          <div>
            <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '14px', color: '#1A1A1A', letterSpacing: '0.2em', lineHeight: 1 }}>AUTONEX AI</p>
            <p style={{ fontSize: '10px', color: 'rgba(26,26,26,0.38)', letterSpacing: '0.08em', marginTop: '3px' }}>Client Portal</p>
          </div>
        </div>

        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.38)', marginBottom: '10px' }}>Password Reset</p>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(40px,6vw,56px)', color: '#1A1A1A', letterSpacing: '0.03em', lineHeight: 0.9, marginBottom: '16px' }}>SET YOUR<br />NEW PASSWORD</h1>
        <p style={{ fontSize: '13px', color: 'rgba(26,26,26,0.48)', lineHeight: 1.65, marginBottom: '28px' }}>Choose a strong password for your portal account.</p>
        <div style={{ height: '1px', background: 'rgba(26,26,26,0.1)', marginBottom: '28px' }} />

        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} /></div>}>
          <ChangePasswordForm />
        </Suspense>
      </motion.div>
    </div>
  )
}
