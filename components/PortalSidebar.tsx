'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePortalUser } from '@/lib/usePortalUser'
import {
  LayoutDashboard, Milestone, FileText, Receipt, MessageSquare,
  FolderOpen, ClipboardList, LifeBuoy, Gift, Star, Settings,
  LogOut, ChevronRight, Menu, X, User,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/timeline',    label: 'Timeline',    icon: Milestone },
  { href: '/documents',   label: 'Documents',   icon: FileText },
  { href: '/invoices',    label: 'Invoices',    icon: Receipt },
  { href: '/messages',    label: 'Messages',    icon: MessageSquare },
  { href: '/files',       label: 'Files',       icon: FolderOpen },
  { href: '/onboarding',  label: 'Onboarding',  icon: ClipboardList },
  { href: '/support',     label: 'Support',     icon: LifeBuoy },
  { href: '/referrals',   label: 'Referrals',   icon: Gift },
  { href: '/feedback',    label: 'Feedback',    icon: Star },
  { href: '/settings',    label: 'Settings',    icon: Settings },
]

function NavItem({ item, active, onClick }: { item: typeof navItems[0]; active: boolean; onClick?: () => void }) {
  return (
    <Link href={item.href} onClick={onClick}>
      <motion.div whileHover={{ x: 2 }} className={`sidebar-item ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
        <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-white/90' : 'text-slate-500'}`} />
        <span className="flex-1">{item.label}</span>
        {active && <ChevronRight className="w-3.5 h-3.5 text-blue-400/60" />}
      </motion.div>
    </Link>
  )
}

export default function PortalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = usePortalUser()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="Autonex AI" className="h-8 w-auto object-contain" />
          <div>
            <p className="text-sm font-bold text-white">Autonex AI</p>
            <p className="text-[10px] text-slate-500">Client Portal</p>
          </div>
        </Link>
      </div>

      {/* User badge */}
      {user && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-600 truncate capitalize">{user.portal_role?.replace('client_', '') || 'Viewer'}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return <NavItem key={item.href} item={item} active={active} onClick={() => setMobileOpen(false)} />
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <button onClick={handleSignOut} className="sidebar-item sidebar-item-inactive w-full text-left text-red-400/70 hover:text-red-400 hover:bg-red-500/5">
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#0d1a35] border-r border-white/5 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile menu button — positioned below TopBar (h-14 = 56px) */}
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-[4.25rem] left-4 z-40 w-9 h-9 rounded-xl bg-[#0d1a35] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#0d1a35] z-50 border-r border-white/5">
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
