'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import { motion } from 'framer-motion'
import { FolderOpen, Upload, Download, FileText, Image, Video, FileArchive, Trash2, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'

const FILE_ICONS: Record<string, any> = { 'image': Image, 'video': Video, 'application/zip': FileArchive }

function getFileIcon(type: string) {
  if (type.startsWith('image')) return Image
  if (type.startsWith('video')) return Video
  if (type.includes('zip') || type.includes('rar')) return FileArchive
  return FileText
}

export default function FilesPage() {
  const { clientId, user, authUser, loading: userLoading } = usePortalUser()
  const supabase = createClient()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data } = await supabase.from('files').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!clientId) return
    const ch = supabase.channel(`portal-files:${clientId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'files', filter: `client_id=eq.${clientId}` }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [clientId, load])

  const upload = async (fileList: FileList) => {
    if (!clientId || !authUser) return
    setUploading(true)
    for (const file of Array.from(fileList)) {
      const path = `${clientId}/client/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('files').upload(path, file)
      if (error) { console.error(error); continue }
      await supabase.from('files').insert({
        client_id: clientId, uploaded_by: authUser.id, uploader_name: user?.name || 'Client',
        uploader_type: 'client', file_name: file.name, file_size: file.size, file_type: file.type,
        storage_path: path, is_deliverable: false,
      })
    }
    setUploading(false); load()
  }

  const download = async (f: any) => {
    const { data } = await supabase.storage.from('files').createSignedUrl(f.storage_path, 60)
    if (data?.signedUrl) { const a = document.createElement('a'); a.href = data.signedUrl; a.download = f.file_name; a.click() }
  }

  const teamFiles = files.filter(f => f.uploader_type === 'team')
  const myFiles = files.filter(f => f.uploader_type === 'client')

  if (userLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clientId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <FolderOpen className="w-10 h-10 text-slate-700" />
      <p className="text-slate-500 text-sm">No client account linked. Contact your account manager.</p>
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-white">Files</h1><p className="text-slate-500 text-sm mt-1">Upload and download project files</p></div>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary flex items-center gap-2 text-sm">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload File
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={e => e.target.files && upload(e.target.files)} />
      </div>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); e.dataTransfer.files && upload(e.dataTransfer.files) }}
        className={`mb-6 border-2 border-dashed rounded-2xl p-6 text-center transition-all ${drag ? 'border-blue-400 bg-blue-500/5' : 'border-slate-200 hover:border-white/15'}`}
      >
        <Upload className="w-6 h-6 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Drag & drop files here, or click Upload</p>
      </div>

      {/* From Autonex */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-white mb-3">From Autonex ({teamFiles.length})</h2>
        {teamFiles.length === 0 ? <p className="text-xs text-slate-600">No files from your team yet</p> : (
          <div className="space-y-2">
            {teamFiles.map((f, i) => { const Icon = getFileIcon(f.file_type || ''); return (
              <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="glass-card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-blue-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{f.file_name}</p><p className="text-[10px] text-slate-600">{format(new Date(f.created_at), 'dd MMM yyyy')}</p></div>
                <button onClick={() => download(f)} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-blue-400"><Download className="w-3.5 h-3.5" /></button>
              </motion.div>
            )})}
          </div>
        )}
      </div>

      {/* Uploaded by you */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Uploaded by you ({myFiles.length})</h2>
        {myFiles.length === 0 ? <p className="text-xs text-slate-600">No files uploaded yet</p> : (
          <div className="space-y-2">
            {myFiles.map((f, i) => { const Icon = getFileIcon(f.file_type || ''); return (
              <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="glass-card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-violet-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{f.file_name}</p><p className="text-[10px] text-slate-600">{format(new Date(f.created_at), 'dd MMM yyyy')}</p></div>
                <button onClick={() => download(f)} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-blue-400"><Download className="w-3.5 h-3.5" /></button>
              </motion.div>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}
