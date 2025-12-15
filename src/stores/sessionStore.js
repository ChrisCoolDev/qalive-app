import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { sessionService } from '@/services/sessionService'

const SESSION_DURATION_MS = 10 * 60 * 60 * 1000 // 4 heures

export const useSessionStore = defineStore('session', () => {
  // --- State: Data & Pagination ---
  const sessions = ref([])
  const totalSessions = ref(0)
  const totalQuestions = ref(0)
  const activeSessions = ref(0)
  const page = ref(1)
  const pageSize = 5

  // --- State: UI & Feedback ---
  const loading = ref(false)
  const errorMsg = ref('')
  const successMsg = ref('')
  const errorUpgradeMessage = ref('')
  const showModal = ref(false)
  const showUpgradePlanModal = ref(false)

  // --- State: Form & Creation ---
  const sessionName = ref('')
  const accessCode = ref('')
  const createdSessionId = ref(null)
  const createdSessionSlug = ref(null)

  // --- State: Auth ---
  const user = ref(null)

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

    // PGRST116: Code spécifique Supabase quand .single() ne trouve aucun résultat (ce qu'on veut ici)
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return slugToCheck

    return generateUniqueSlug(baseSlug, attempt + 1)
  }

  // --- Actions ---
  async function fetchDashboardData() {
    loading.value = true
    errorMsg.value = ''

    try {
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

  async function createSession() {
    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''
    createdSessionId.value = null
    createdSessionSlug.value = null

    try {
      const {
        data: { session: authSession },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError || !authSession) {
        throw new Error('Veuillez vous connecter pour créer une session.')
      }

      const uniqueSlug = await generateUniqueSlug(slugify(sessionName.value))
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert([
          {
            name: sessionName.value,
            slug: uniqueSlug,
            access_code: accessCode.value || null,
            user_id: authSession.user.id,
            expires_at: expiresAt,
          },
        ])
        .select('id, slug')
        .single()

      if (createError) throw createError

      successMsg.value = 'Session créée avec succès !'
      createdSessionId.value = newSession.id
      createdSessionSlug.value = newSession.slug

      // Reset form
      sessionName.value = ''
      accessCode.value = ''

      await fetchDashboardData()
      return true
    } catch (err) {
      errorMsg.value = err.message
      return false
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

  // --- Auth Listener ---
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
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
    errorUpgradeMessage,
    showModal,
    showUpgradePlanModal,
    sessionName,
    accessCode,
    successMsg,
    createdSessionId,
    createdSessionSlug,
    user,

    totalPages,
    sessionQuestionUrl,

    fetchDashboardData,
    createSession,
    nextPage,
    prevPage,
    redirectToSessionQrCode,
  }
})
