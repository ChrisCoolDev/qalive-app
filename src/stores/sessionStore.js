import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { sessionService } from '@/services/sessionService'
import { supabase } from '@/lib/supabase'

/**
 * Store Pinia pour la gestion des sessions utilisateur.
 *
 * Ce store centralise l'état et la logique liés aux sessions :
 * - Récupération des données du tableau de bord (sessions paginées et statistiques globales).
 * - Gestion de la pagination.
 * - Création de nouvelles sessions.
 * - Suivi de l'état de l'utilisateur connecté.
 */
export const useSessionStore = defineStore('session', () => {
  const sessions = ref([])
  const totalSessions = ref(0)
  const totalQuestions = ref(0)
  const loading = ref(false)
  const errorMsg = ref('')
  const activeSessions = ref(0)

  const page = ref(1)
  const pageSize = 5

  const user = ref(null)

  const showModal = ref(false)
  const sessionName = ref('')
  const accessCode = ref('')
  const successMsg = ref('')
  const createdSessionId = ref(null)

  /**
   * Calcule le nombre total de pages en fonction du nombre total de sessions.
   */
  const totalPages = computed(() => {
    if (totalSessions.value === 0) return 1
    return Math.ceil(totalSessions.value / pageSize)
  })

  /**
   * Construit l'URL complète pour la page des questions d'une session nouvellement créée.
   */
  const sessionQuestionUrl = computed(() =>
    createdSessionId.value ? `${window.location.origin}/${createdSessionId.value}` : '',
  )

  /**
   * Action principale pour charger toutes les données nécessaires au tableau de bord.
   * Elle récupère les sessions paginées et les statistiques globales en parallèle.
   */
  async function fetchDashboardData() {
    loading.value = true
    errorMsg.value = ''
    try {
      // Lance les deux appels au service en parallèle pour optimiser le temps de chargement
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

  /**
   * Gère la création d'une nouvelle session.
   */
  async function createSession() {
    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''
    createdSessionId.value = null

    const {
      data: { session: authSession },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !authSession) {
      errorMsg.value = 'Veuillez vous connecter pour créer une session.'
      loading.value = false
      return false
    }

    const expirationDate = new Date()
    expirationDate.setHours(expirationDate.getHours() + 4) // Expiration dans 4 heures

    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert([
        {
          name: sessionName.value,
          access_code: accessCode.value || null,
          user_id: authSession.user.id,
          expires_at: expirationDate.toISOString(),
        },
      ])
      .select('id')
      .single()

    loading.value = false

    if (createError) {
      errorMsg.value = createError.message
      return false
    }

    successMsg.value = 'Session créée avec succès !'
    createdSessionId.value = newSession.id
    // Réinitialiser les champs du formulaire
    sessionName.value = ''
    accessCode.value = ''

    // Recharger les données pour refléter la nouvelle session
    await fetchDashboardData()
    return true
  }

  /**
   * Redirige l'utilisateur vers la page du QR code de la session créée.
   */
  async function redirectToSessionQrCode() {
    if (createdSessionId.value) {
      window.location.href = `/session/${createdSessionId.value}/qrcode`
    }
  }

  // Actions de pagination
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

  // Écoute en temps réel les changements d'état de l'authentification
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
    showModal,
    sessionName,
    accessCode,
    successMsg,
    createdSessionId,
    user,

    // Getters
    totalPages,
    sessionQuestionUrl,

    fetchDashboardData,
    createSession,
    nextPage,
    prevPage,
    redirectToSessionQrCode,
  }
})
