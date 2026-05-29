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
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: au } } = await supabase.auth.getUser()
        if (!au) { setLoading(false); return }
        setAuthUser(au)

        // Always query portal_users table first — this is the source of truth
        const { data: pu } = await supabase
          .from('portal_users')
          .select('*')
          .eq('user_id', au.id)
          .maybeSingle()

        if (pu) {
          // Found a portal_users record — use its client_id
          setUser(pu as PortalUser)
          setClientId(pu.client_id)
        } else {
          // Fallback: try app_metadata.client_id (set during invite acceptance)
          const cidFromMeta = au.app_metadata?.client_id
          if (cidFromMeta) setClientId(cidFromMeta)
        }
      } catch (err) {
        console.error('[usePortalUser] error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { user, clientId, authUser, loading }
}
