'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, LogOut, Settings, ChevronDown
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  link?: string
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/timeline': 'Timeline',
  '/documents': 'Documents',
  '/invoices': 'Invoices',
  '/messages': 'Messages',
  '/files': 'Files',
  '/onboarding': 'Onboarding',
  '/support': 'Support',
  '/referrals': 'Referrals',
  '/feedback': 'Feedback',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/messages/')) return 'Messages'
  if (pathname.startsWith('/support/')) return 'Support'
  return 'Portal'
}

export default function PortalTopBar() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user) {
        setUserEmail(user.email ?? '')
        supabase.from('portal_users')
          .select('name')
          .eq('user_id', user.id)
          .single()
          .then(({ data }: any) => {
            if (data?.name) setUserName(data.name)
            else setUserName(user.email?.split('@')[0] ?? 'User')
          })
      }
    })
  }, [supabase])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) {
        setNotifications(data as Notification[])
        setUnread(data.filter((n: any) => !n.read).length)
      }
    }
    load()
  }, [supabase])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  const pageTitle = getPageTitle(pathname)

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Page title */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-[9px] text-white rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Notifications</span>
                  {unread > 0 && (
                    <span className="text-[10px] text-blue-600">{unread} new</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">
                      No notifications yet
                    </div>
                  ) : notifications.slice(0, 8).map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => { if (n.link) router.push(n.link); setShowNotifs(false) }}
                    >
                      <p className="text-xs text-slate-900 font-medium truncate">{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
            <span className="text-sm text-slate-700 font-medium hidden sm:block max-w-[120px] truncate">
              {userName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
