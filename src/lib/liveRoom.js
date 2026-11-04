/**
 * QALive — Utilitaires purs de la Live Room (aucune dépendance Supabase/Vue).
 * Isolés ici pour être testés par `npm run test:critical`.
 */

export const LIVE_ROLES = Object.freeze({
  HOST: 'host', // speaker (dashboard, télécommande)
  STAGE: 'stage', // écran projeté
  AUDIENCE: 'audience', // participant
})

export const LIVE_EVENTS = Object.freeze({
  REACTION: 'reaction', // { key, emoji } envoyé par un participant
  HIGHLIGHT_QUESTION: 'highlight_question', // { questionId, question } envoyé par le speaker
})

/**
 * Catalogue des 5 réactions live (inspiré du moodboard GDG / salih.dev).
 * Zéro écriture en base : diffusées uniquement en Realtime Broadcast.
 */
export const REACTION_CATALOG = Object.freeze([
  Object.freeze({ key: 'clap', emoji: '👏', label: 'Clap' }),
  Object.freeze({ key: 'idea', emoji: '💡', label: 'Got it' }),
  Object.freeze({ key: 'wow', emoji: '🤯', label: 'Wow' }),
  Object.freeze({ key: 'haha', emoji: '😂', label: 'Haha' }),
  Object.freeze({ key: 'love', emoji: '❤️', label: 'Love' }),
])

export const REACTION_THROTTLE_MS = 300
export const MAX_STAGE_PARTICLES = 40

const VALID_REACTION_KEYS = new Set(REACTION_CATALOG.map((r) => r.key))

export function isValidReactionKey(key) {
  return typeof key === 'string' && VALID_REACTION_KEYS.has(key)
}

export function getReactionByKey(key) {
  return REACTION_CATALOG.find((r) => r.key === key) || null
}

/**
 * Limiteur de cadence par appareil (1 réaction / 300ms par défaut)
 * pour éviter tout spam WebSocket en amphithéâtre.
 */
export function createReactionLimiter(cooldownMs = REACTION_THROTTLE_MS, nowFn = () => Date.now()) {
  let lastSentAt = -Infinity
  return {
    tryAcquire() {
      const now = nowFn()
      if (now - lastSentAt < cooldownMs) return false
      lastSentAt = now
      return true
    },
    reset() {
      lastSentAt = -Infinity
    },
  }
}

/**
 * Traduit les touches d'un clicker USB standard (Logitech R400, Spotlight…)
 * ou du clavier en commandes de scène.
 */
export function mapStageKeyToAction(key) {
  switch (key) {
    case 'ArrowRight':
    case 'PageDown':
    case ' ':
      return 'next'
    case 'ArrowLeft':
    case 'PageUp':
      return 'prev'
    case 'b':
    case 'B':
    case '.':
      return 'blackout'
    case 'f':
    case 'F':
      return 'fullscreen'
    case 'Escape':
      return 'clear'
    default:
      return null
  }
}

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

