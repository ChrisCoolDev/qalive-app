import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { sessionService } from '@/services/sessionService'
import { analytics } from '@/lib/analytics'

const FREE_SESSION_DURATION_MS = 2 * 60 * 60 * 1000 // 2 heures (Free)

export const useSessionStore = defineStore('session', () => {
  // --- State: Data & Pagination ---
  const sessions = ref([])
  const totalSessions = ref(0)
  const totalQuestions = ref(0)
  const activeSessions = ref(0)
  const page = ref(1)
  const pageSize = 5

  // --- State: User Profile & Plan ---
  const user = ref(null)
  const isPremium = ref(false)
  const userPlan = ref('basic')

  // --- State: UI & Feedback ---
  const loading = ref(false)
  const errorMsg = ref('')
  const successMsg = ref('')
  const showModal = ref(false)
  const showUpgradePlanModal = ref(false)

  // --- State: Form & Creation ---
  const sessionName = ref('')
  const accessCode = ref('')
  const customDuration = ref(2) // Heures (Pro)

  const createdSessionId = ref(null)
  const createdSessionSlug = ref(null)

  // --- Computed ---
  const totalPages = computed(() => {
    return totalSessions.value === 0 ? 1 : Math.ceil(totalSessions.value / pageSize)
  })

  const sessionQuestionUrl = computed(() =>
    createdSessionSlug.value ? `${window.location.origin}/ask/${createdSessionSlug.value}` : '',
  )

  // --- Helpers ---
  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  async function generateUniqueSlug(baseSlug, attempt = 0) {
    const slugToCheck = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('slug', slugToCheck)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return slugToCheck
    return generateUniqueSlug(baseSlug, attempt + 1)
  }

  // --- Actions ---

  async function fetchDashboardData() {
    loading.value = true
    errorMsg.value = ''

    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession()
      if (!authSession) return

      // 1. Récupérer le statut Premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, plan')
        .eq('id', authSession.user.id)
        .single()

      if (profile) {
        isPremium.value =
          Boolean(profile.is_premium) ||
          ['pro', 'premium', 'premium_plus', 'cancelled_pro'].includes(profile.plan)
        userPlan.value = profile.plan || 'basic'
      }

      // 2. Récupérer les sessions
      const [sessionsData, statsData] = await Promise.all([
        sessionService.fetchSessions(page.value, pageSize, supabase),
        sessionService.fetchDashboardStats(supabase),
      ])

      sessions.value = sessionsData
      totalSessions.value = statsData.totalSessions
      totalQuestions.value = statsData.totalQuestions
      activeSessions.value = statsData.activeSessions

      return true
    } catch (err) {
      errorMsg.value = err.message || 'Une erreur est survenue.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function createSession(options = {}) {
    if (!isPremium.value && totalSessions.value >= 3) {
      showModal.value = false
      showUpgradePlanModal.value = true
      analytics.trackEvent('upgrade_modal_opened', { reason: 'session_limit_3_reached' })
      return false
    }

    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''

    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession()
      if (!authSession) throw new Error('Veuillez vous connecter.')

      const userId = authSession.user.id
      const uniqueSlug = await generateUniqueSlug(slugify(sessionName.value))

      const finalDurationMs = isPremium.value
        ? customDuration.value * 60 * 60 * 1000
        : FREE_SESSION_DURATION_MS

      const startDate = options.startsAt instanceof Date ? options.startsAt : new Date()
      const expiresAt = new Date(startDate.getTime() + finalDurationMs).toISOString()

      // Insert DB
      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert([
          {
            name: sessionName.value,
            slug: uniqueSlug,
            access_code: accessCode.value?.trim() || null,
            user_id: userId,
            starts_at: options.startsAt instanceof Date ? options.startsAt.toISOString() : null,
            type: options.type || 'qna',
            expires_at: expiresAt,
          },
        ])
        .select('id, slug')
        .single()

      if (createError) throw createError

      successMsg.value = 'Session créée avec succès !'
      createdSessionId.value = newSession.id
      createdSessionSlug.value = newSession.slug

      analytics.trackEvent('session_created', {
        slug: newSession.slug,
        is_premium: isPremium.value,
      })

      // Reset Form
      sessionName.value = ''
      accessCode.value = ''
      customDuration.value = 2

      await fetchDashboardData()
      return true
    } catch (err) {
      errorMsg.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteSession(sessionId) {
    if (!isPremium.value) {
      errorMsg.value = 'Fonctionnalité réservée aux membres Pro.'
      return
    }

    if (!confirm('Voulez-vous vraiment supprimer cette session ?')) return

    loading.value = true
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
      if (error) throw error
      await fetchDashboardData()
    } catch (err) {
      errorMsg.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function redirectToSessionQrCode() {
    if (createdSessionSlug.value) {
      window.location.href = `/session/${createdSessionSlug.value}/qrcode`
    }
  }

  function nextPage() {
    if (page.value < totalPages.value) {
      page.value++
      fetchDashboardData()
    }
  }

  function prevPage() {
    if (page.value > 1) {
      page.value--
      fetchDashboardData()
    }
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
    if (user.value) fetchDashboardData()
  })

  return {
    sessions,
    totalSessions,
    totalQuestions,
    activeSessions,
    page,
    pageSize,
    loading,
    errorMsg,
    successMsg,
    showModal,
    showUpgradePlanModal,
    sessionName,
    accessCode,
    customDuration,
    createdSessionId,
    createdSessionSlug,
    user,
    totalPages,
    sessionQuestionUrl,
    isPremium,

    fetchDashboardData,
    createSession,
    deleteSession,
    nextPage,
    prevPage,
    redirectToSessionQrCode,
  }
})
