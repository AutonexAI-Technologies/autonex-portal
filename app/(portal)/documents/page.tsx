'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Clock, File, Image, Film, Archive,
  CheckCircle2, AlertCircle, Loader2, FolderOpen, Music,
} from 'lucide-react'
import { format } from 'date-fns'

function fileIcon(type: string) {
  if (type?.startsWith('image/')) return Image
  if (type?.startsWith('video/')) return Film
  if (type?.startsWith('audio/')) return Music
  if (type?.includes('pdf') || type?.includes('document')) return FileText
  if (type?.includes('zip') || type?.includes('tar') || type?.includes('rar')) return Archive
  return File
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

const STATUS_CONFIG = {
  approved:          { label: 'Approved',       icon: CheckCircle2, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending:           { label: 'Pending Review', icon: Clock,         cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  changes_requested: { label: 'Changes Needed', icon: AlertCircle,  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function DocumentsPage() {
  const { clientId, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'deliverable'>('all')

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('client_id', clientId)
      .eq('uploader_type', 'team')
      .order('created_at', { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }, [clientId, supabase])

  useEffect(() => { load() }, [load])

  async function download(fileId: string, fileName: string) {
    setDownloadingId(fileId)
    const a = document.createElement('a')
    a.href = `/api/portal/files/download?file_id=${fileId}`
    a.download = fileName
    a.click()
    setTimeout(() => setDownloadingId(null), 2000)
  }

  const filtered = filter === 'deliverable'
    ? files.filter(f => f.is_deliverable)
    : files

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    )
  }

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <FileText className="w-10 h-10 text-slate-700" />
        <p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <FolderOpen className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Documents</h1>
                <p className="text-xs text-slate-500">Files & deliverables from your team</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{files.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total files</p>
          </div>
        </div>

        {/* Filter chips */}
        {files.some(f => f.is_deliverable) && (
          <div className="flex gap-2 mt-5">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'deliverable', label: '✅ Deliverables' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id as any)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                  filter === id
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.15]'
                }`}
                style={filter !== id ? { background: 'rgba(255,255,255,0.04)' } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <FolderOpen className="w-7 h-7 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium mb-1">No documents yet</p>
            <p className="text-slate-600 text-sm">Your team will share files here as the project progresses.</p>
          </div>
        </motion.div>
      ) : (
        /* File grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((f, i) => {
              const FIcon = fileIcon(f.file_type)
              const statusConf = f.is_deliverable && f.approval_status
                ? STATUS_CONFIG[f.approval_status as keyof typeof STATUS_CONFIG]
                : null
              const StatusIcon = statusConf?.icon
              const isDownloading = downloadingId === f.id

              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                  className="group relative rounded-2xl p-4 transition-all cursor-default"
                  style={{
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(255,255,255,0.055)'
                    el.style.borderColor = 'rgba(124,58,237,0.3)'
                    el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(255,255,255,0.035)'
                    el.style.borderColor = 'rgba(255,255,255,0.08)'
                    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* File icon + type indicator */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.15)' }}>
                      <FIcon className="w-5 h-5 text-violet-400" />
                    </div>
                    {statusConf && StatusIcon && (
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border ${statusConf.cls}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {statusConf.label}
                      </span>
                    )}
                  </div>

                  {/* File name */}
                  <p className="text-sm font-semibold text-white mb-0.5 truncate leading-snug"
                    title={f.file_name}>
                    {f.file_name}
                  </p>

                  {f.description && (
                    <p className="text-[11px] text-slate-500 truncate mb-2">{f.description}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 mb-3">
                    {f.file_size > 0 && <span>{formatSize(f.file_size)}</span>}
                    {f.file_size > 0 && <span>·</span>}
                    <Clock className="w-2.5 h-2.5" />
                    <span>{format(new Date(f.created_at), 'dd MMM yyyy')}</span>
                  </div>

                  {/* Download button */}
                  <motion.button
                    onClick={() => download(f.id, f.file_name)}
                    disabled={isDownloading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                    style={{
                      background: isDownloading ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      color: '#a78bfa',
                    }}
                  >
                    {isDownloading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Downloading…</span></>
                      : <><Download className="w-3.5 h-3.5" /><span>Download</span></>
                    }
                  </motion.button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
