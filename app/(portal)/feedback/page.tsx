'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion } from 'framer-motion'
import { Star, Send, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'

export default function FeedbackPage() {
  const { clientId, user, authUser, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [form, setForm] = useState({ went_well: '', to_improve: '', would_refer: false })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !authUser || !rating) return
    setSubmitting(true)
    await supabase.from('feedback').insert({
      client_id: clientId,
      submitted_by: authUser.id,
      rating,
      what_went_well: form.went_well,
      what_to_improve: form.to_improve,
      would_refer: form.would_refer ? 'yes' : 'no',
    })
    setSubmitted(true); setSubmitting(false)
  }

  if (userLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (submitted) {
    return (
      <div className="px-6 py-8 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You! 🎉</h2>
          <p className="text-slate-500 text-sm mb-6">Your feedback helps us improve. We&apos;d love it if you could share your experience!</p>
          <div className="flex flex-col gap-3">
            <a href="https://g.page/r/your-google-review" target="_blank" rel="noopener" className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
              <ExternalLink className="w-4 h-4" /> Leave a Google Review
            </a>
            <a href="https://www.linkedin.com/in/autonex-ai/" target="_blank" rel="noopener" className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
              <ExternalLink className="w-4 h-4" /> Recommend on LinkedIn
            </a>
            <a href="https://www.instagram.com/autonexai_org/" target="_blank" rel="noopener" className="px-4 py-2.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 text-sm font-medium flex items-center justify-center gap-2 hover:bg-pink-100 transition-colors">
              <ExternalLink className="w-4 h-4" /> Follow on Instagram
            </a>
            <p className="text-xs text-slate-400 mt-2">Share a post or story recommending us on your socials!</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Feedback</h1><p className="text-slate-500 text-sm mt-1">Tell us about your experience</p></div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        {/* Star rating */}
        <div>
          <label className="text-xs text-slate-600 mb-2 block font-medium">How would you rate your experience?</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} className="p-1 transition-transform hover:scale-110">
                <Star className={`w-8 h-8 ${n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} transition-colors`} />
              </button>
            ))}
          </div>
          {rating > 0 && <p className="text-xs text-slate-500 mt-1">{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}</p>}
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1.5 block font-medium">What went well?</label>
          <textarea value={form.went_well} onChange={e => setForm(f => ({ ...f, went_well: e.target.value }))} rows={3} placeholder="Share what you liked..." className="input-dark w-full resize-none" />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1.5 block font-medium">What could we improve?</label>
          <textarea value={form.to_improve} onChange={e => setForm(f => ({ ...f, to_improve: e.target.value }))} rows={3} placeholder="Any suggestions..." className="input-dark w-full resize-none" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`w-10 h-6 rounded-full transition-colors relative ${form.would_refer ? 'bg-blue-500' : 'bg-slate-200'}`} onClick={() => setForm(f => ({ ...f, would_refer: !f.would_refer }))}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.would_refer ? 'left-5' : 'left-1'}`} />
          </div>
          <span className="text-sm text-slate-700">Would you refer us to others?</span>
        </label>

        {/* Social follow */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2 font-medium">Follow us & share your experience</p>
          <div className="flex gap-2">
            <a href="https://www.instagram.com/autonexai_org/" target="_blank" rel="noopener" className="flex-1 py-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-pink-100 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Instagram
            </a>
            <a href="https://www.linkedin.com/in/autonex-ai/" target="_blank" rel="noopener" className="flex-1 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
            </a>
          </div>
        </div>

        <button type="submit" disabled={!rating || submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-colors shadow-sm">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /><span>Submit Feedback</span></>}
        </button>
      </motion.form>
    </div>
  )
}
