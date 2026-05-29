'use client'

import PortalSidebar from '@/components/PortalSidebar'
import PortalTopBar from '@/components/PortalTopBar'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <PortalTopBar />
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
