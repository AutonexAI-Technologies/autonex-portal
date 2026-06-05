'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X, Info } from 'lucide-react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastCtx {
  toast: (t: Omit<Toast, 'id'>) => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `t-${++counter.current}`
    setToasts(p => [...p, { ...t, id }])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000)
  }, [])

  const dismiss = (id: string) => setToasts(p => p.filter(x => x.id !== id))

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-sm ${
                t.variant === 'destructive'
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {t.variant === 'destructive'
                  ? <XCircle className="w-4 h-4 text-white" />
                  : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{t.title}</p>
                {t.description && (
                  <p className={`text-xs mt-1 leading-snug ${t.variant === 'destructive' ? 'text-red-100' : 'text-slate-500'}`}>
                    {t.description}
                  </p>
                )}
              </div>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
