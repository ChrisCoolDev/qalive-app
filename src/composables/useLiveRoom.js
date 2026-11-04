/**
 * QALive — Composable unique de la Live Room (Phase 0)
 *
 * Point d'entrée temps réel pour toutes les briques à venir :
 *  - Presence  : compteur de participants (actif dès la Phase 0)
 *  - Broadcast : événements éphémères sans écriture BDD (réactions, clics — Phases 1/4)
 *
 * Les canaux historiques `questions:session_*` et `files:session_*` ne sont PAS touchés :
 * ce composable ouvre un canal séparé `room:<slug>`, donc zéro régression possible sur le Q&A.
 *
 * Usage :
 *   const { audienceCount, connected, send, on } = useLiveRoom(slug, { role: 'host' })
 */
import { ref, onUnmounted, getCurrentInstance } from 'vue'
import { supabase } from '@/lib/supabase'
import { LIVE_ROLES, liveChannelName, getOrCreateDeviceId, countAudience } from '@/lib/liveRoom'

export function useLiveRoom(slug, { role = LIVE_ROLES.AUDIENCE, autoJoin = true } = {}) {
  const audienceCount = ref(0)
  const connected = ref(false)
  const error = ref(null)

  const deviceId = getOrCreateDeviceId()
  const listeners = new Map() // event -> Set<handler>
  let channel = null

  function dispatch(event, payload) {
    const handlers = listeners.get(event)
    if (!handlers) return
    for (const handler of handlers) {
      try {
        handler(payload)
      } catch (err) {
        console.error(`[useLiveRoom] handler "${event}" failed:`, err)
      }
    }
  }

  function join() {
    if (channel || !slug) return
    try {
      channel = supabase.channel(liveChannelName(slug), {
        config: {
          presence: { key: deviceId },
          broadcast: { self: false, ack: false },
        },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          audienceCount.value = countAudience(channel.presenceState())
        })
        // Broadcast générique : tous les événements passent par un seul type "live"
        .on('broadcast', { event: 'live' }, ({ payload }) => {
          if (payload?.type) dispatch(payload.type, payload.data)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            connected.value = true
            await channel.track({ role, joined_at: new Date().toISOString() })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            connected.value = false
            error.value = status
          } else if (status === 'CLOSED') {
            connected.value = false
          }
        })
    } catch (err) {
      // Le temps réel est un bonus : il ne doit jamais casser la page hôte
      console.error('[useLiveRoom] join failed:', err)
      error.value = err?.message || 'join_failed'
    }
  }

  function leave() {
    if (!channel) return
    try {
      channel.untrack()
      supabase.removeChannel(channel)
    } catch (err) {
      console.error('[useLiveRoom] leave failed:', err)
    } finally {
      channel = null
      connected.value = false
      audienceCount.value = 0
    }
  }

  /** Émet un événement éphémère à toute la room (aucune écriture en base). */
  function send(type, data = {}) {
    if (!channel || !connected.value) return false
    channel.send({ type: 'broadcast', event: 'live', payload: { type, data, from: role } })
    return true
  }

  /** Écoute un type d'événement. Retourne une fonction de désabonnement. */
  function on(type, handler) {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type).add(handler)
    return () => listeners.get(type)?.delete(handler)
  }

  if (autoJoin) join()
  if (getCurrentInstance()) onUnmounted(leave)

  return { audienceCount, connected, error, deviceId, join, leave, send, on }
}

