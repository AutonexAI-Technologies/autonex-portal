import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Autonex AI — Client Portal',
  description: 'Your project dashboard, communication hub, and document center.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
