'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion } from 'framer-motion'
import { User, Phone, Building, Lock, Loader2, Check, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { user, authUser } = usePortalUser()
  const supabase = createClient()
  const [profile, setProfile] = useState({ name: '', phone: '', company: '' })
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [error, setError] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', phone: user.phone || '', company: '' })
  }, [user])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch('/api/portal/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save'); setSaving(false); return
      }
      setSaved(true); setSaving(false)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Network error'); setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError('')
    if (pw.newPw !== pw.confirm) { setPwError('Passwords do not match'); return }
    if (pw.newPw.length < 8) { setPwError('Min 8 characters'); return }
    setPwSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password: pw.newPw })
    if (err) { setPwError(err.message); setPwSaving(false); return }
    setPw({ current: '', newPw: '', confirm: '' })
    setPwSaved(true); setPwSaving(false)
    setTimeout(() => setPwSaved(false), 2000)
  }

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">Settings</h1><p className="text-slate-500 text-sm mt-1">Manage your profile and preferences</p></div>

      {/* Profile */}
      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={saveProfile} className="glass-card p-6 space-y-4 mb-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><User className="w-4 h-4 text-blue-400" /> Profile</h2>
        {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Full Name</label>
          <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="input-dark w-full pl-10" /></div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Phone</label>
          <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="input-dark w-full pl-10" /></div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
          <input value={authUser?.email || ''} disabled className="input-dark w-full opacity-50 cursor-not-allowed" />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}
        </button>
      </motion.form>

      {/* Password */}
      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={changePassword} className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Lock className="w-4 h-4 text-violet-400" /> Change Password</h2>
        {pwError && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{pwError}</div>}

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">New Password</label>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input type={showPw ? 'text' : 'password'} value={pw.newPw} onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))} placeholder="Min 8 characters" className="input-dark w-full pl-10 pr-10" minLength={8} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Confirm Password</label>
          <input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat password" className="input-dark w-full" />
        </div>

        <button type="submit" disabled={pwSaving || !pw.newPw} className="btn-primary w-full flex items-center justify-center gap-2">
          {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : pwSaved ? <><Check className="w-4 h-4" /> Updated</> : 'Update Password'}
        </button>
      </motion.form>
    </div>
  )
}
