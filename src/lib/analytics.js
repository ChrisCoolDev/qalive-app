import { supabase } from '@/lib/supabase'
import { parseUTCDate } from '@/utils/dateHelper'
import { detectVisitorCountryCode, getCountryFlag, getCountryName } from '@/utils/geoHelper'

const LOCAL_STORAGE_PV_KEY = 'qalive_pulse_pv_v1'
const LOCAL_STORAGE_EV_KEY = 'qalive_pulse_ev_v1'
const MAX_LOCAL_ITEMS = 500

export const FOUNDER_EMAILS = [
  'talchrist10@gmail.com',
  'talchrist09@gmail.com',
  ...(import.meta.env.VITE_ADMIN_EMAIL ? [import.meta.env.VITE_ADMIN_EMAIL.toLowerCase().trim()] : []),
]

/**
 * Vérifie si l'email connecté est celui du fondateur
 */
export function isFounderEmail(email) {
  if (!email) return false
  return FOUNDER_EMAILS.includes(String(email).toLowerCase().trim())
}

/**
 * Détecte si l'application tourne sur le sous-domaine dédié (ex: analytic.qalive.online)
 */
export function isAnalyticsSubdomain() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname.toLowerCase()
  return (
    host.startsWith('analytic.') ||
    host.startsWith('analytics.') ||
    new URLSearchParams(window.location.search).get('app') === 'analytic'
  )
}

/**
 * Génère une empreinte visiteur quotidienne anonyme (sans cookie permanent ni IP)
 * Change automatiquement chaque jour à minuit UTC (conforme RGPD comme Plausible)
 */
export function getDailyVisitorHash() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = [
      navigator.userAgent || '',
      navigator.language || '',
      screen?.width || 0,
      screen?.height || 0,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      today,
    ].join('|')

    let h1 = 0xdeadbeef
    let h2 = 0x41c6ce57
    for (let i = 0; i < raw.length; i++) {
      const ch = raw.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    return 'v_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
  } catch {
    return 'v_anon'
  }
}

/**
 * Détecte le type d'appareil sans librairie lourde
 */
export function getDeviceType() {
  if (typeof navigator === 'undefined') return 'Desktop'
  const ua = navigator.userAgent || ''
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 768) {
    return 'Mobile'
  }
  return 'Desktop'
}

/**
 * Normalise la source de trafic (Referrer ou UTM)
 */
export function getCleanSource() {
  try {
    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get('utm_source') || params.get('ref') || params.get('source')
    if (utmSource) return { referrer: utmSource.toLowerCase(), utm_source: utmSource.toLowerCase() }

    const ref = document.referrer
    if (!ref) return { referrer: 'Direct', utm_source: null }

    const refUrl = new URL(ref)
    if (refUrl.hostname === window.location.hostname) {
      return { referrer: 'Direct', utm_source: null }
    }
    return {
      referrer: refUrl.hostname.replace(/^www\./, ''),
      utm_source: null,
    }
  } catch {
    return { referrer: 'Direct', utm_source: null }
  }
}

function saveLocalItem(key, item) {
  try {
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw) : []
    list.unshift(item)
    if (list.length > MAX_LOCAL_ITEMS) list.length = MAX_LOCAL_ITEMS
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // Ignore storage quota errors
  }
}

function readLocalItems(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

let lastTrackedPath = null
let lastTrackedTime = 0

export const analytics = {
  /**
   * Enregistre une vue de page sur l'app principale (ignore le sous-domaine analytic.*)
   */
  async trackPageView(rawPath) {
    try {
      // Ne pas polluer les stats quand le fondateur consulte son dashboard analytic.qalive.online
      if (isAnalyticsSubdomain()) return

      const path = (rawPath || window.location.pathname).split('?')[0]
      if (path === '/analytics') return

      const now = Date.now()
      if (path === lastTrackedPath && now - lastTrackedTime < 1000) return
      lastTrackedPath = path
      lastTrackedTime = now

      const { referrer, utm_source } = getCleanSource()
      const country_code = detectVisitorCountryCode()
      const payload = {
        path,
        referrer,
        utm_source,
        device_type: getDeviceType(),
        country_code,
        visitor_hash: getDailyVisitorHash(),
        created_at: new Date().toISOString(),
      }

      saveLocalItem(LOCAL_STORAGE_PV_KEY, payload)

      const { error: insertErr } = await supabase.from('analytics_page_views').insert([
        {
          path: payload.path,
          referrer: payload.referrer,
          utm_source: payload.utm_source,
          device_type: payload.device_type,
          country_code: payload.country_code,
          visitor_hash: payload.visitor_hash,
        },
      ])

      // Fallback si la colonne country_code n'a pas encore été ajoutée en base
      if (insertErr) {
        await supabase.from('analytics_page_views').insert([
          {
            path: payload.path,
            referrer: payload.referrer,
            utm_source: payload.utm_source,
            device_type: payload.device_type,
            visitor_hash: payload.visitor_hash,
          },
        ])
      }
    } catch {
      // Silencieux pour ne jamais perturber l'UX
    }
  },

  /**
   * Enregistre un événement métier du funnel (ex: 'session_created', 'question_submitted', 'checkout_clicked')
   */
  async trackEvent(eventName, metadata = {}) {
    try {
      const path = window.location.pathname
      const visitor_hash = getDailyVisitorHash()
      let userId = null

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        userId = session?.user?.id || null
      } catch {
        // Ignore
      }

      const payload = {
        event_name: eventName,
        path,
        visitor_hash,
        user_id: userId,
        metadata,
        created_at: new Date().toISOString(),
      }

      saveLocalItem(LOCAL_STORAGE_EV_KEY, payload)

      if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
        window.plausible(eventName, { props: metadata })
      }

      await supabase.from('analytics_events').insert([
        {
          event_name: payload.event_name,
          path: payload.path,
          visitor_hash: payload.visitor_hash,
          user_id: payload.user_id,
          metadata: payload.metadata,
        },
      ])
    } catch {
      // Silencieux
    }
  },

  /**
   * Récupère et agrège toutes les métriques GLOBALES de la plateforme pour le fondateur
   * @param {number} days - Nombre de jours (1, 7, 30, 90)
   */
  async fetchDashboardMetrics(days = 7) {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const sinceISO = sinceDate.toISOString()

    let pageViews = []
    let events = []
    let dbTableReady = true

    // 1. Lecture globale des vues de pages depuis Supabase
    const { data: pvData, error: pvError } = await supabase
      .from('analytics_page_views')
      .select('*')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(10000)

    if (pvError) {
      dbTableReady = false
      pageViews = readLocalItems(LOCAL_STORAGE_PV_KEY).filter(
        (item) => new Date(item.created_at) >= sinceDate,
      )
    } else {
      pageViews = pvData || []
    }

    // 2. Lecture globale des événements depuis Supabase
    const { data: evData, error: evError } = await supabase
      .from('analytics_events')
      .select('event_name, path, visitor_hash, metadata, created_at')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(10000)

    if (evError) {
      events = readLocalItems(LOCAL_STORAGE_EV_KEY).filter(
        (item) => new Date(item.created_at) >= sinceDate,
      )
    } else {
      events = evData || []
    }

    // 3. Lecture GLOBALE des sessions, questions & abonnés Pro sur toute la plateforme
    let northStarSessions = 0
    let periodSessionsCreated = 0
    let periodQuestionsAsked = 0
    let activatedSessionsCount = 0
    let proSubscribersCount = 0

    try {
      const [allSessionsRes, proProfilesRes] = await Promise.all([
        supabase.from('sessions').select('id, created_at, questions(count)'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_premium', true),
      ])

      if (typeof proProfilesRes.count === 'number') {
        proSubscribersCount = proProfilesRes.count
      }

      if (allSessionsRes.data) {
        for (const s of allSessionsRes.data) {
          const createdDate = parseUTCDate(s.created_at)
          const qCount = s.questions?.[0]?.count || 0
          if (!createdDate || createdDate >= sinceDate) {
            periodSessionsCreated++
            periodQuestionsAsked += qCount
            if (qCount >= 1) activatedSessionsCount++
            if (qCount >= 5) northStarSessions++
          }
        }
      }
    } catch {
      // Ignore
    }

    // 4. Agrégations (Visiteurs uniques, Top Pages, Top Sources, Pays, Devices, Courbe journalière)
    const uniqueVisitorSet = new Set()
    const pagesMap = new Map()
    const sourcesMap = new Map()
    const countriesMap = new Map()
    const devicesMap = { Desktop: 0, Mobile: 0 }
    const eventsMap = new Map()
    const fallbackCountry = detectVisitorCountryCode()

    for (const pv of pageViews) {
      const vHash = pv.visitor_hash || 'v_anon'
      uniqueVisitorSet.add(vHash)

      // Top Pages
      const p = pv.path || '/'
      if (!pagesMap.has(p)) {
        pagesMap.set(p, { path: p, views: 0, visitors: new Set() })
      }
      const pageEntry = pagesMap.get(p)
      pageEntry.views++
      pageEntry.visitors.add(vHash)

      // Top Sources
      const src = pv.utm_source || pv.referrer || 'Direct'
      if (!sourcesMap.has(src)) {
        sourcesMap.set(src, { source: src, views: 0, visitors: new Set() })
      }
      const srcEntry = sourcesMap.get(src)
      srcEntry.views++
      srcEntry.visitors.add(vHash)

      // Countries
      const cCode = (pv.country_code && pv.country_code !== 'XX' ? pv.country_code : fallbackCountry).toUpperCase()
      if (!countriesMap.has(cCode)) {
        countriesMap.set(cCode, { code: cCode, views: 0, visitors: new Set() })
      }
      const countryEntry = countriesMap.get(cCode)
      countryEntry.views++
      countryEntry.visitors.add(vHash)

      // Devices
      const dev = pv.device_type === 'Mobile' ? 'Mobile' : 'Desktop'
      devicesMap[dev] = (devicesMap[dev] || 0) + 1
    }

    for (const ev of events) {
      const name = ev.event_name
      eventsMap.set(name, (eventsMap.get(name) || 0) + 1)
    }

    const totalPageviews = pageViews.length
    const uniqueVisitors = uniqueVisitorSet.size

    const topPages = Array.from(pagesMap.values())
      .map((item) => ({
        path: item.path,
        views: item.views,
        visitors: item.visitors.size,
        pct: totalPageviews > 0 ? Math.round((item.views / totalPageviews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)

    const topSources = Array.from(sourcesMap.values())
      .map((item) => ({
        source: item.source,
        visitors: item.visitors.size,
        views: item.views,
        pct: uniqueVisitors > 0 ? Math.round((item.visitors.size / uniqueVisitors) * 100) : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 8)

    const topCountries = Array.from(countriesMap.values())
      .map((item) => ({
        code: item.code,
        name: getCountryName(item.code),
        flag: getCountryFlag(item.code),
        visitors: item.visitors.size,
        views: item.views,
        pct: uniqueVisitors > 0 ? Math.round((item.visitors.size / uniqueVisitors) * 100) : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 12)

    const totalDeviceViews = devicesMap.Desktop + devicesMap.Mobile
    const deviceBreakdown = [
      {
        device: 'Mobile',
        count: devicesMap.Mobile,
        pct: totalDeviceViews > 0 ? Math.round((devicesMap.Mobile / totalDeviceViews) * 100) : 0,
      },
      {
        device: 'Desktop',
        count: devicesMap.Desktop,
        pct: totalDeviceViews > 0 ? Math.round((devicesMap.Desktop / totalDeviceViews) * 100) : 0,
      },
    ]

    // Série temporelle par jour pour le graphique minimaliste
    const chartDays = Math.min(days, 14)
    const dailyBuckets = new Map()
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      dailyBuckets.set(key, { date: key, label, views: 0, visitors: new Set() })
    }

    for (const pv of pageViews) {
      const key = (pv.created_at || '').slice(0, 10)
      if (dailyBuckets.has(key)) {
        const b = dailyBuckets.get(key)
        b.views++
        b.visitors.add(pv.visitor_hash || 'v_anon')
      }
    }

    const dailySeries = Array.from(dailyBuckets.values()).map((b) => ({
      date: b.date,
      label: b.label,
      views: b.views,
      visitors: b.visitors.size,
    }))

    const funnelEvents = [
      {
        name: 'login_initiated',
        label: 'Connexions / Signups initiés',
        count: eventsMap.get('login_initiated') || 0,
      },
      {
        name: 'session_created',
        label: 'Sessions créées',
        count: eventsMap.get('session_created') || periodSessionsCreated,
      },
      {
        name: 'question_submitted',
        label: 'Questions envoyées',
        count: eventsMap.get('question_submitted') || periodQuestionsAsked,
      },
      {
        name: 'question_limit_reached',
        label: 'Limite 70 questions atteinte',
        count: eventsMap.get('question_limit_reached') || 0,
      },
      {
        name: 'upgrade_modal_opened',
        label: 'Ouvertures modale Pro',
        count: eventsMap.get('upgrade_modal_opened') || 0,
      },
      {
        name: 'checkout_clicked',
        label: 'Clics paiement Lemon Squeezy',
        count: eventsMap.get('checkout_clicked') || 0,
      },
    ]

    const activationRate =
      periodSessionsCreated > 0
        ? Math.round((activatedSessionsCount / periodSessionsCreated) * 100)
        : 0

    return {
      dbTableReady,
      uniqueVisitors,
      totalPageviews,
      northStarSessions,
      periodSessionsCreated,
      periodQuestionsAsked,
      activationRate,
      proSubscribersCount,
      estimatedMrr: Number((proSubscribersCount * 12.99).toFixed(2)),
      topPages,
      topSources,
      topCountries,
      deviceBreakdown,
      dailySeries,
      funnelEvents,
    }
  },
}
