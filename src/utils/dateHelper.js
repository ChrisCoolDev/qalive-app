/**
 * Formate une date ISO en heure locale selon le fuseau horaire de l'utilisateur
 * @param {string} isoString - Date au format ISO
 * @param {string} [timeZone] - Le fuseau horaire cible (ex: "Europe/Paris")
 * @returns {string} Heure formatée (ex: "14:30")
 */
export function formatTimeLocal(isoString, timeZone) {
  if (!isoString) return ''

  const ensuredISO = isoString + 'Z'
  const date = new Date(ensuredISO)
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone

  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  })
}

/**
 * Formate une date ISO en date locale selon le fuseau horaire de l'utilisateur
 * @param {string} isoString - Date au format ISO
 * @param {string} [timeZone] - Le fuseau horaire cible (ex: "Europe/Paris")
 * @returns {string} Date formatée ("26/10/2025")
 */
export function formatDateLocal(isoString, timeZone) {
  if (!isoString) return ''

  const ensuredISO = isoString + 'Z'
  const date = new Date(ensuredISO)
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: tz,
  })
}
