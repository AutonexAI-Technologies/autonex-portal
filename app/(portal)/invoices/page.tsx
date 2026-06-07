'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, CheckCircle2, Clock, AlertCircle, Ban,
  Download, Loader2, RefreshCw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PortalInvoice {
  id: string
  invoice_number: string
  total: number
  gst_amount: number
  gst_enabled: boolean
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
  due_date: string | null
  created_at: string
  is_retainer_invoice: boolean
  client_id: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

const STATUS_CONFIG = {
  Paid:      { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Paid' },
  Pending:   { icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',   label: 'Pending' },
  Overdue:   { icon: AlertCircle,  color: 'text-red-600',     bg: 'bg-red-50 border-red-200',       label: 'Overdue' },
  Cancelled: { icon: Ban,          color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200',   label: 'Cancelled' },
}

export default function InvoicesPage() {
  const { loading: userLoading } = usePortalUser()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<PortalInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portal/invoices')
      const data = await res.json()
      setInvoices(Array.isArray(data) ? data : [])
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load invoices' })
    }
    setLoading(false)
  }, []) // eslint-disable-line

  useEffect(() => { if (!userLoading) load() }, [userLoading]) // eslint-disable-line

  const downloadPDF = async (inv: PortalInvoice) => {
    setDownloadingId(inv.id)
    try {
      const res = await fetch(`/api/portal/invoices/download?invoice_id=${inv.id}`)
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${inv.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ variant: 'destructive', title: 'Download failed', description: 'Please contact support' })
    }
    setDownloadingId(null)
  }

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0)
  const totalPending = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((s, i) => s + i.total, 0)
  const overdueCount = invoices.filter(i => i.status === 'Overdue').length

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-400 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Paid',  value: `₹${fmt(totalPaid)}`,    icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'Outstanding', value: `₹${fmt(totalPending)}`, icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
            { label: 'Overdue',     value: `${overdueCount}`,       icon: AlertCircle,  color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
          ].map((stat) => {
            const SIcon = stat.icon
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`${stat.bg} border ${stat.border} rounded-2xl p-4`}>
                <SIcon className={`w-4 h-4 ${stat.color} mb-2`} />
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Receipt className="w-7 h-7 text-blue-500" />
          </div>
          <p className="text-slate-700 font-semibold">No invoices yet</p>
          <p className="text-slate-400 text-sm text-center max-w-xs">Your invoices will appear here once generated by the Autonex AI team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {invoices.map((inv, i) => {
              const isOverdue = inv.status === 'Pending' && inv.due_date && new Date(inv.due_date) < new Date()
              const effectiveCfg = isOverdue ? STATUS_CONFIG.Overdue : (STATUS_CONFIG[inv.status] || STATUS_CONFIG.Pending)
              const EffIcon = effectiveCfg.icon

              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm hover:border-blue-200 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-bold text-blue-600 font-mono text-sm">{inv.invoice_number}</span>
                        {inv.is_retainer_invoice && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 font-semibold">🔄 Retainer</span>
                        )}
                        <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold ${effectiveCfg.bg} ${effectiveCfg.color}`}>
                          <EffIcon className="w-2.5 h-2.5" />
                          {isOverdue ? 'Overdue' : effectiveCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span>Issued {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {inv.due_date && (
                          <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                            Due {new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {inv.gst_enabled && <span>incl. GST ₹{fmt(inv.gst_amount)}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-slate-900">₹{fmt(inv.total)}</p>
                      <button onClick={() => downloadPDF(inv)} disabled={downloadingId === inv.id}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50 ml-auto">
                        {downloadingId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        PDF
                      </button>
                    </div>
                  </div>
                  {isOverdue && (
                    <div className="mt-3 pt-3 border-t border-red-100 flex items-center gap-2 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      Payment overdue — please contact <strong className="ml-1">hello@autonexai.org</strong>
                    </div>
                  )}
                  {inv.status === 'Paid' && (
                    <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center gap-2 text-xs text-emerald-600">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      Payment received — thank you!
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <p className="text-center text-xs text-slate-300 pb-4">
        For payment queries, contact <span className="text-blue-400 font-medium">hello@autonexai.org</span>
      </p>
    </div>
  )
}
