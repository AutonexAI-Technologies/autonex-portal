'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen, Upload, Download, FileText, Image, Video,
  FileArchive, Trash2, Loader2, RefreshCw, Music
} from 'lucide-react'
import { format } from 'date-fns'

function getFileIcon(type: string) {
  if (type.startsWith('image')) return Image
  if (type.startsWith('video')) return Video
  if (type.startsWith('audio')) return Music
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return FileArchive
  return FileText
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function FilesPage() {
  const { clientId, user, authUser, loading: userLoading } = usePortalUser()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const [replaceTarget, setReplaceTarget] = useState<any>(null)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/files?client_id=${clientId}`)
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : [])
    } catch {
      console.error('Failed to load files')
    }
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  const upload = async (fileList: FileList, replaceFile?: any) => {
    if (!clientId || !authUser) return
    setUploading(true)

    for (const file of Array.from(fileList)) {
      setUploadProgress(`Uploading ${file.name}…`)

      // If replacing, delete the old file first
      if (replaceFile) {
        await fetch(`/api/portal/files/upload?file_id=${replaceFile.id}`, { method: 'DELETE' })
      }

      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/portal/files/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Upload error:', err.error)
      }
    }

    setUploading(false)
    setUploadProgress('')
    setReplaceTarget(null)
    load()
  }

  const download = async (f: any) => {
    const res = await fetch(`/api/portal/files/upload?file_id=${f.id}&expires=60`)
    const d = await res.json()
    if (d.url) {
      const a = document.createElement('a')
      a.href = d.url
      a.download = f.file_name
      a.click()
    }
  }

  const deleteFile = async (f: any) => {
    if (!confirm(`Delete "${f.file_name}"? This cannot be undone.`)) return
    setDeletingId(f.id)
    const res = await fetch(`/api/portal/files/upload?file_id=${f.id}`, { method: 'DELETE' })
    if (res.ok) {
      setFiles(prev => prev.filter(x => x.id !== f.id))
    }
    setDeletingId(null)
  }

  const startReplace = (f: any) => {
    setReplaceTarget(f)
    replaceRef.current?.click()
  }

  const teamFiles = files.filter(f => f.uploader_type === 'team')
  const myFiles = files.filter(f => f.uploader_type === 'client')

  if (userLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clientId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <FolderOpen className="w-10 h-10 text-slate-400" />
      <p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p>
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Files</h1>
          <p className="text-slate-500 text-sm mt-1">Upload, download, replace and delete project files</p>
        </div>
        <button
          onClick={() => { setReplaceTarget(null); inputRef.current?.click() }}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-200"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? uploadProgress : 'Upload File'}
        </button>
      </div>

      {/* Hidden inputs */}
      <input ref={inputRef} type="file" multiple hidden
        onChange={e => e.target.files && upload(e.target.files)} />
      <input ref={replaceRef} type="file" hidden
        onChange={e => e.target.files && upload(e.target.files, replaceTarget)} />

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); e.dataTransfer.files && upload(e.dataTransfer.files) }}
        onClick={() => { setReplaceTarget(null); inputRef.current?.click() }}
        className={`mb-6 border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          drag ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
        }`}
      >
        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Drag & drop files here, or click to upload</p>
        <p className="text-[11px] text-slate-400 mt-1">Any file type · Max 50MB per file</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Files from Autonex */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-500" />
              From Autonex ({teamFiles.length})
            </h2>
            {teamFiles.length === 0 ? (
              <p className="text-xs text-slate-400 pl-1">No files shared by your team yet</p>
            ) : (
              <div className="space-y-2">
                {teamFiles.map((f, i) => {
                  const Icon = getFileIcon(f.file_type || '')
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 font-medium truncate">{f.file_name}</p>
                        <p className="text-[10px] text-slate-400">{formatSize(f.file_size)} · {format(new Date(f.created_at), 'dd MMM yyyy')}</p>
                      </div>
                      <button onClick={() => download(f)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Download">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Files uploaded by client */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-500" />
              Uploaded by you ({myFiles.length})
            </h2>
            {myFiles.length === 0 ? (
              <p className="text-xs text-slate-400 pl-1">No files uploaded yet</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {myFiles.map((f, i) => {
                    const Icon = getFileIcon(f.file_type || '')
                    const isDeleting = deletingId === f.id
                    return (
                      <motion.div key={f.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.03 }}
                        className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-violet-200 hover:shadow-sm transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 font-medium truncate">{f.file_name}</p>
                          <p className="text-[10px] text-slate-400">{formatSize(f.file_size)} · {format(new Date(f.created_at), 'dd MMM yyyy')}</p>
                        </div>
                        {/* Actions — visible on hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => download(f)} title="Download"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => startReplace(f)} title="Replace with new file"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteFile(f)} title="Delete" disabled={isDeleting}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
