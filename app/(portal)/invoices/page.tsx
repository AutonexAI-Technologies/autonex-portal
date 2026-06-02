'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion } from 'framer-motion'
import { Receipt, Clock, ExternalLink, IndianRupee } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

const STATUS_STYLE: Record<string, string> = {
  paid:    'badge-green',
  pending: 'badge-yellow',
  overdue: 'badge-red',
  draft:   'badge-slate',
}

export default function InvoicesPage() {
  const { clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setInvoices(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!clientId) return
    const channel = supabase
      .channel(`portal-invoices:${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `client_id=eq.${clientId}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [clientId, load])

  if (userLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clientId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Receipt className="w-10 h-10 text-slate-700" />
      <p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p>
    </div>
  )

  const totalUnpaid = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">View and track your payments</p>
        </div>
        {totalUnpaid > 0 && (
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/15">
            <p className="text-[10px] text-amber-500">Outstanding</p>
            <p className="text-lg font-bold text-amber-400 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" />
              {totalUnpaid.toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Receipt className="w-10 h-10 text-slate-700" />
          <p className="text-slate-500 text-sm">No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, i) => {
            const daysLeft = inv.due_date ? differenceInDays(new Date(inv.due_date), new Date()) : null
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card p-4 hover:border-slate-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{inv.invoice_number || `INV-${String(inv.id).slice(0, 8)}`}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{inv.description || 'Invoice'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${STATUS_STYLE[inv.status] ?? 'badge-slate'}`}>{inv.status}</span>
                        {inv.due_date && inv.status !== 'paid' && (
                          <span className={`text-[10px] flex items-center gap-1 ${(daysLeft ?? 0) < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                            <Clock className="w-2.5 h-2.5" />
                            {(daysLeft ?? 0) < 0 ? `${Math.abs(daysLeft!)}d overdue` : `${daysLeft}d left`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">₹{(inv.total_amount || 0).toLocaleString('en-IN')}</p>
                    {inv.due_date && <p className="text-[10px] text-slate-600 mt-0.5">Due {format(new Date(inv.due_date), 'dd MMM yyyy')}</p>}
                  </div>
                </div>
                {inv.status !== 'paid' && inv.payment_link && (
                  <a href={inv.payment_link} target="_blank" rel="noopener" className="mt-3 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg w-full font-medium transition-colors">
                    <ExternalLink className="w-3 h-3" /> Pay Now
                  </a>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
