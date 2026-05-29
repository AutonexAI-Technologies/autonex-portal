'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions {
  table: string
  event?: RealtimeEvent
  filter?: string
  onData: () => void
}

/**
 * Subscribe to Supabase Realtime postgres_changes.
 * Calls `onData` callback whenever a matching event fires — the callback
 * should re-fetch the full dataset to stay in sync.
 */
export function useRealtime({ table, event = '*', filter, onData }: UseRealtimeOptions) {
  const onDataRef = useRef(onData)
  onDataRef.current = onData

  useEffect(() => {
    const supabase = createClient()
    const channelName = `portal-${table}-${filter || 'all'}-${Date.now()}`

    const params: any = { event, schema: 'public', table }
    if (filter) params.filter = filter

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', params, () => {
        onDataRef.current()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, filter])
}

/**
 * Convenience hooks for common tables
 */
export function useRealtimeMessages(threadId: string, onData: () => void) {
  useRealtime({ table: 'chat_messages', filter: `thread_id=eq.${threadId}`, onData })
}

export function useRealtimeMilestones(clientId: string | null, onData: () => void) {
  useRealtime({
    table: 'project_milestones',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    onData,
  })
}

export function useRealtimeInvoices(clientId: string | null, onData: () => void) {
  useRealtime({
    table: 'invoices',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    onData,
  })
}

export function useRealtimeFiles(clientId: string | null, onData: () => void) {
  useRealtime({
    table: 'files',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    onData,
  })
}

export function useRealtimeTickets(clientId: string | null, onData: () => void) {
  useRealtime({
    table: 'support_tickets',
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    onData,
  })
}

export function useRealtimeNotifications(userId: string | null, onData: () => void) {
  useRealtime({
    table: 'notifications',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onData,
  })
}
