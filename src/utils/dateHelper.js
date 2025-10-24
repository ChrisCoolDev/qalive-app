export function formatDateLocal(isoString) {
  if (!isoString) return ''

  const date = new Date(isoString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formate une date ISO en heure locale selon le fuseau horaire de l'utilisateur
 * @param {string} isoString - Date au format ISO
 * @returns {string} Heure formatée (ex: "14:30")
 */
export function formatTimeLocal(isoString) {
  if (!isoString) return ''

  const date = new Date(isoString)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
