/**
 * Convertit de manière fiable une chaîne de date issue de Supabase/Postgres en objet Date UTC
 * Gère les formats "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DDTHH:mm:ss", avec ou sans suffixe 'Z' ou offset '+00:00'
 * @param {string|Date} dateInput
 * @returns {Date|null}
 */
export function parseUTCDate(dateInput) {
  if (!dateInput) return null
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput

  let str = String(dateInput).trim()
  if (!str) return null

  // Remplacer l'espace entre date et heure par 'T' (format SQL standard -> ISO 8601)
  if (/^\d{4}-\d{2}-\d{2}\s/.test(str)) {
    str = str.replace(/\s+/, 'T')
  }

  // Ajouter 'Z' uniquement si aucun indicateur de fuseau horaire n'est présent en fin de chaîne
  const hasTimezone = /Z$/i.test(str) || /[+-]\d{2}:?\d{2}$/.test(str) || /[+-]\d{2}$/.test(str)
  if (!hasTimezone) {
    str += 'Z'
  }

  const parsed = new Date(str)
  return isNaN(parsed.getTime()) ? new Date(dateInput) : parsed
}

/**
 * Formate une date ISO en heure locale selon le fuseau horaire de l'utilisateur
 * @param {string|Date} isoString - Date au format ISO
 * @param {string} [timeZone] - Le fuseau horaire cible (ex: "Europe/Paris")
 * @returns {string} Heure formatée (ex: "14:30")
 */
export function formatTimeLocal(isoString, timeZone) {
  const date = parseUTCDate(isoString)
  if (!date || isNaN(date.getTime())) return ''

  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone

  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  })
}

/**
 * Formate une date ISO en date locale selon le fuseau horaire de l'utilisateur
 * @param {string|Date} isoString - Date au format ISO
 * @param {string} [timeZone] - Le fuseau horaire cible (ex: "Europe/Paris")
 * @returns {string} Date formatée ("26/10/2025")
 */
export function formatDateLocal(isoString, timeZone) {
  const date = parseUTCDate(isoString)
  if (!date || isNaN(date.getTime())) return ''

  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: tz,
  })
}
