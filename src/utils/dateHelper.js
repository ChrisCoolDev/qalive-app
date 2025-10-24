// utils/dateHelper.js
export function formatDateToLocal(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function getTimeRemaining(expiresAt) {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry - now

  if (diff <= 0) return 'Expired'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m remaining`
}
