'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion } from 'framer-motion'
import { FileText, Download, ExternalLink, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function DocumentsPage() {
  const { clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data } = await supabase.from('files').select('*')
      .eq('client_id', clientId).eq('uploader_type', 'team').order('created_at', { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  function download(fileId: string, fileName: string) {
    // Use proxy endpoint — Supabase URL never exposed in browser
    const a = document.createElement('a')
    a.href = `/api/portal/files/download?file_id=${fileId}`
    a.download = fileName
    a.click()
  }

  if (userLoading || loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!clientId) return <div className="flex flex-col items-center justify-center h-64 gap-3"><FileText className="w-10 h-10 text-slate-700" /><p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p></div>

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-white">Documents</h1><p className="text-slate-500 text-sm mt-1">Files shared by your project team</p></div>
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FileText className="w-10 h-10 text-slate-700" />
          <p className="text-slate-500 text-sm">No documents yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card p-4 hover:border-white/12 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{f.file_name}</p>
                  {f.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{f.description}</p>}
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600">
                    <Clock className="w-2.5 h-2.5" />
                    {format(new Date(f.created_at), 'dd MMM yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => download(f.id, f.file_name)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/15">
                  <Download className="w-3 h-3" /> Download
                </button>
                {f.is_deliverable && f.approval_status && (
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${f.approval_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : f.approval_status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {f.approval_status}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
