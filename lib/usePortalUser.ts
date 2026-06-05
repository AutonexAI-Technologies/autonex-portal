'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface PortalUser {
  id: string
  user_id: string
  client_id: string
  name: string
  email: string
  phone: string | null
  portal_role: string
}

export function usePortalUser() {
  const supabase = createClient()
  const [user, setUser] = useState<PortalUser | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: au } } = await supabase.auth.getUser()
        if (!au) { setLoading(false); return }
        setAuthUser(au)

        // Use admin API to bypass RLS — always reliable
        const res = await fetch('/api/portal/settings')
        if (res.ok) {
          const pu = await res.json()
          if (pu && pu.client_id) {
            setUser(pu as PortalUser)
            setClientId(pu.client_id)
            setLoading(false)
            return
          }
        }

        // Fallback: try app_metadata.client_id (set during invite)
        const cidFromMeta = au.app_metadata?.client_id
        if (cidFromMeta) setClientId(cidFromMeta)

        // Also try user_metadata for name
        if (au.user_metadata?.name || au.user_metadata?.full_name) {
          setUser({
            id: '',
            user_id: au.id,
            client_id: cidFromMeta || '',
            name: au.user_metadata?.name || au.user_metadata?.full_name || '',
            email: au.email || '',
            phone: null,
            portal_role: au.app_metadata?.portal_role || 'client_viewer',
          })
        }
      } catch (err) {
        console.error('[usePortalUser] error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line

  return { user, clientId, authUser, loading }
}
