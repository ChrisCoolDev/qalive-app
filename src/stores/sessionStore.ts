import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { sessionService } from '@/services/sessionService'
import { sessionRepository } from '@/repositories/sessionRepository'
import type { Session } from '@/types'

const FREE_SESSION_DURATION_MS = 2 * 60 * 60 * 1000 // 2 heures (Free)

export const useSessionStore = defineStore('session', () => {
  // --- State: Data & Pagination ---
  const sessions = ref<Session[]>([])
  const totalSessions = ref(0)
  const totalQuestions = ref(0)
  const activeSessions = ref(0)
  const page = ref(1)
  const pageSize = 5

  // --- State: User Profile & Plan ---
  const user = ref<any>(null)
  const isPremium = ref(false)
  const userPlan = ref('basic')

  // --- State: UI & Feedback ---
  const loading = ref(false)
  const errorMsg = ref('')
  const successMsg = ref('')
  const showModal = ref(false)
  const showUpgradePlanModal = ref(false)
  const activeSidebarTab = ref<'overview' | 'archive' | 'trash'>('overview')

  // --- State: Form & Creation ---
  const sessionName = ref('')
  const accessCode = ref('')
  const customDuration = ref(2) // Heures (Pro)
  const sessionLogoFile = ref<File | null>(null) // Fichier image (Pro)

  const createdSessionId = ref<number | null>(null)
  const createdSessionSlug = ref<string | null>(null)

  // --- Computed ---
  const totalPages = computed(() => {
    return totalSessions.value === 0 ? 1 : Math.ceil(totalSessions.value / pageSize)
  })

  const sessionQuestionUrl = computed(() =>
    createdSessionSlug.value ? `${window.location.origin}/ask/${createdSessionSlug.value}` : '',
  )

  // --- Helpers ---
  function slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  async function generateUniqueSlug(baseSlug: string, attempt = 0): Promise<string> {
    const slugToCheck = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`
    const data = await sessionRepository.checkSlugExists(supabase, slugToCheck)
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
      if (!authSession) return false

      // 1. Récupérer le statut Premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, plan')
        .eq('id', authSession.user.id)
        .single()

      if (profile) {
        isPremium.value = profile.is_premium
        userPlan.value = profile.plan
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
    } catch (err: any) {
      errorMsg.value = err.message || 'Une erreur est survenue.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function createSession() {
    if (!isPremium.value && totalSessions.value >= 3) {
      showModal.value = false
      showUpgradePlanModal.value = true
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

      const expiresAt = new Date(Date.now() + finalDurationMs).toISOString()

      let logoUrl = null
      if (isPremium.value && sessionLogoFile.value) {
        logoUrl = await sessionRepository.uploadLogo(supabase, sessionLogoFile.value, userId)
      }

      // Insert DB via Repository
      const newSession = await sessionRepository.insertSession(supabase, {
        name: sessionName.value,
        slug: uniqueSlug,
        access_code: accessCode.value || null,
        user_id: userId,
        expires_at: expiresAt,
        logo_url: logoUrl,
      })

      successMsg.value = 'Session créée avec succès !'
      createdSessionId.value = newSession.id
      createdSessionSlug.value = newSession.slug

      // Reset Form
      sessionName.value = ''
      accessCode.value = ''
      customDuration.value = 2
      sessionLogoFile.value = null

      await fetchDashboardData()
      return true
    } catch (err: any) {
      errorMsg.value = err.message || 'Une erreur est survenue.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteSession(sessionId: number) {
    if (!isPremium.value) {
      errorMsg.value = 'Fonctionnalité réservée aux membres Pro.'
      return
    }

    if (!confirm('Voulez-vous vraiment supprimer cette session ?')) return

    loading.value = true
    try {
      await sessionRepository.deleteSession(supabase, sessionId)
      await fetchDashboardData()
    } catch (err: any) {
      errorMsg.value = err.message || 'Une erreur est survenue.'
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
    sessionLogoFile,
    createdSessionId,
    createdSessionSlug,
    user,
    totalPages,
    sessionQuestionUrl,
    isPremium,
    userPlan,
    activeSidebarTab,

    fetchDashboardData,
    createSession,
    deleteSession,
    nextPage,
    prevPage,
    redirectToSessionQrCode,
  }
})
