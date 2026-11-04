/**
 * QALive — Feature flags par session (Phase 0 Live Room)
 *
 * Règle d'or anti-régression : une session SANS colonne `features` (ou avec '{}')
 * garde EXACTEMENT le comportement historique (Q&A + documents).
 * Les nouvelles briques (réactions, sondages, slides, télécommande) sont OFF par défaut.
 */

export const DEFAULT_FEATURES = Object.freeze({
  qa: true, // Questions/Réponses (historique, toujours actif)
  files: true, // Documents partagés (historique, toujours actif)
  presence: true, // Compteur de participants (Phase 0)
  reactions: true, // Phase 1 : barre de réactions live (Broadcast, 0 écriture BDD)
  stage: true, // Phase 1 : écran de scène /stage/:slug
  polls: false, // Phase 2
  slides: false, // Phase 3
  remote: false, // Phase 4
})

/**
 * Fusionne les flags stockés en base avec les valeurs par défaut.
 * Ignore les clés inconnues et les valeurs non booléennes (données corrompues).
 */
export function resolveFeatures(rawFeatures) {
  const resolved = { ...DEFAULT_FEATURES }
  if (!rawFeatures || typeof rawFeatures !== 'object' || Array.isArray(rawFeatures)) {
    return resolved
  }
  for (const key of Object.keys(DEFAULT_FEATURES)) {
    if (typeof rawFeatures[key] === 'boolean') {
      resolved[key] = rawFeatures[key]
    }
  }
  return resolved
}

/**
 * @param {object|null} session - ligne `sessions` (doit contenir `features`)
 * @param {keyof DEFAULT_FEATURES} key
 */
export function isFeatureEnabled(session, key) {
  if (!(key in DEFAULT_FEATURES)) return false
  return resolveFeatures(session?.features)[key]
}

