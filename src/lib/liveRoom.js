/**
 * QALive — Utilitaires purs de la Live Room (aucune dépendance Supabase/Vue).
 * Isolés ici pour être testés par `npm run test:critical`.
 */

export const LIVE_ROLES = Object.freeze({
  HOST: 'host', // speaker (dashboard, télécommande)
  STAGE: 'stage', // écran projeté
  AUDIENCE: 'audience', // participant
})

const DEVICE_ID_KEY = 'qalive_device_id'

/** Nom de canal Realtime unique par room. Séparé des canaux existants `questions:*` / `files:*`. */
export function liveChannelName(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new Error('liveChannelName: slug is required')
  }
  return `room:${slug}`
}

/**
 * Identifiant anonyme et stable par appareil (pas de cookie, pas de donnée perso).
 * Sert de clé Presence : plusieurs onglets du même téléphone = 1 participant.
 */
export function getOrCreateDeviceId(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  const generate = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`

  if (!storage) return generate()
  try {
    const existing = storage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const id = generate()
    storage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    // Safari navigation privée, quota plein… on reste fonctionnel
    return generate()
  }
}

/**
 * Compte les participants à partir de `channel.presenceState()`.
 * Format Supabase : { [presenceKey]: [{ role, ... }, ...] }
 * - 1 clé = 1 appareil (même si plusieurs onglets)
 * - le speaker et l'écran de scène ne sont pas comptés dans l'audience
 */
export function countAudience(presenceState) {
  if (!presenceState || typeof presenceState !== 'object') return 0
  let count = 0
  for (const metas of Object.values(presenceState)) {
    if (!Array.isArray(metas) || metas.length === 0) continue
    const isAudience = metas.some((m) => (m?.role ?? LIVE_ROLES.AUDIENCE) === LIVE_ROLES.AUDIENCE)
    if (isAudience) count += 1
  }
  return count
}

