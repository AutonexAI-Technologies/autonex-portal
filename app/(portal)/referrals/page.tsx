'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion } from 'framer-motion'
import { Gift, Copy, Check, Share2, Users, IndianRupee, ExternalLink } from 'lucide-react'

export default function ReferralsPage() {
  const { clientId, user, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [referral, setReferral] = useState<any>(null)
  const [credits, setCredits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const [{ data: ref }, { data: creds }] = await Promise.all([
      supabase.from('referrals').select('*').eq('referrer_client_id', clientId).maybeSingle(),
      supabase.from('referral_credits').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    ])
    setReferral(ref); setCredits(creds ?? []); setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  const shareUrl = referral ? `https://www.autonexai.org?ref=${referral.referral_code}` : ''
  const totalCredits = credits.reduce((s, c) => s + (c.amount || 0), 0)

  const copyCode = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out Autonex AI! Use my referral: ${shareUrl}`)}`, '_blank')
  const shareEmail = () => window.open(`mailto:?subject=Check out Autonex AI&body=${encodeURIComponent(`I've been working with Autonex AI and they're great! Use my referral link: ${shareUrl}`)}`, '_blank')

  if (userLoading || loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!clientId) return <div className="flex flex-col items-center justify-center h-64 gap-3"><Gift className="w-10 h-10 text-slate-300" /><p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p></div>

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Referrals</h1><p className="text-slate-500 text-sm mt-1">Refer friends and earn credits</p></div>

      {!referral ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Gift className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 text-sm">Referral program not yet activated for your account</p>
          <p className="text-slate-400 text-xs">Contact your account manager to get started</p>
        </div>
      ) : (
        <>
          {/* Code card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Your Referral Code</p>
            <div className="flex items-center gap-3 mb-4">
              <code className="text-2xl font-bold text-blue-600 tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-200 flex-1 text-center">{referral.referral_code}</code>
              <button onClick={copyCode} className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-all">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={shareWhatsApp} className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition-colors">
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button onClick={shareEmail} className="flex-1 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Email
              </button>
              <button onClick={copyCode} className="flex-1 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium hover:bg-violet-100 flex items-center justify-center gap-1.5 transition-colors">
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-slate-900">{referral.total_referrals || 0}</p>
              <p className="text-xs text-slate-500">Referrals Made</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
              <IndianRupee className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-slate-900">₹{totalCredits.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500">Credits Earned</p>
            </div>
          </div>

          {/* Credit history */}
          {credits.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Credit History</h2>
              <div className="space-y-2">
                {credits.map(c => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <p className="text-sm text-slate-900">{c.description || 'Referral credit'}</p>
                    <p className="text-sm font-bold text-emerald-600">+₹{c.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Social follow section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Follow &amp; Support Us</h3>
        <p className="text-xs text-slate-500 mb-4">Share a post or story recommending us on your socials — it means the world to us!</p>
        <div className="flex gap-3">
          <a href="https://www.instagram.com/autonexai_org/" target="_blank" rel="noopener" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-200 text-pink-700 text-sm font-medium flex items-center justify-center gap-2 hover:from-purple-100 hover:to-pink-100 transition-all">
            <ExternalLink className="w-4 h-4" /> Instagram
          </a>
          <a href="https://www.linkedin.com/in/autonex-ai/" target="_blank" rel="noopener" className="flex-1 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-all">
            <ExternalLink className="w-4 h-4" /> LinkedIn
          </a>
        </div>
      </div>
    </div>
  )
}
