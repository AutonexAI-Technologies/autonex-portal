import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/hooks/use-toast'

export const metadata: Metadata = {
  title: 'Autonex AI — Client Portal',
  description: 'Your project dashboard, communication hub, and document center.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
