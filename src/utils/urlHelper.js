/**
 * QALive URL & Auth Sanitizer Helper
 *
 * Nettoie silencieusement et immédiatement les tokens d'authentification Supabase
 * (#access_token=..., #refresh_token=..., ?code=...) et paramètres de paiement éphémères
 * de la barre d'adresse dès que la session est initialisée.
 *
 * Évite toute fuite de token dans l'historique du navigateur, les logs referrer,
 * les partages d'écran ou les copier-coller d'URL.
 */

export function cleanAuthUrl(customLocation = null, customHistory = null) {
  const loc = customLocation || (typeof window !== 'undefined' ? window.location : null)
  const hist = customHistory || (typeof window !== 'undefined' ? window.history : null)
  if (!loc || !hist) return null

  const href = loc.href || ''
  const hash = loc.hash || ''

  const isAuthHash =
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('error_code=') ||
    hash.includes('error_description=')

  let url
  try {
    url = new URL(href, 'https://localhost')
  } catch {
    return null
  }

  const isAuthQuery =
    url.searchParams.has('code') ||
    (url.searchParams.has('error') && url.searchParams.has('error_description'))

  const isCheckoutQuery =
    url.searchParams.has('checkout') || url.searchParams.has('order_id')

  if (!isAuthHash && !isAuthQuery && !isCheckoutQuery) {
    return null
  }

  if (isAuthQuery) {
    url.searchParams.delete('code')
    url.searchParams.delete('error')
    url.searchParams.delete('error_description')
  }

  if (isCheckoutQuery) {
    url.searchParams.delete('checkout')
    url.searchParams.delete('order_id')
  }

  const cleanSearch = url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''
  const cleanHash = isAuthHash ? '' : (url.hash || '')
  const cleanUrl = `${url.pathname}${cleanSearch}${cleanHash}`

  try {
    if (typeof hist.replaceState === 'function') {
      const state = hist.state || {}
      const title = typeof document !== 'undefined' ? document.title : ''
      hist.replaceState(state, title, cleanUrl)
    }
  } catch (err) {
    console.error('Failed to clean auth tokens from URL:', err)
  }

  return cleanUrl
}

