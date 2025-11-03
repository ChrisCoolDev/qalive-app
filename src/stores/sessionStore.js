import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { sessionService } from '@/services/sessionService'

export const useSessionStore = defineStore('session', () => {
  const sessions = ref([])
  const totalSessions = ref(0)
  const totalQuestions = ref(0)
  const loading = ref(false)
  const errorMsg = ref('')
  const errorUpgradeMessage = ref('')
  const activeSessions = ref(0)

  const page = ref(1)
  const pageSize = 5

  const user = ref(null)

  const showModal = ref(false)
  const showUpgradePlanModal = ref(false)
  const sessionName = ref('')
  const accessCode = ref('')
  const successMsg = ref('')
  const createdSessionId = ref(null)
  const createdSessionSlug = ref(null)

  const totalPages = computed(() => {
    if (totalSessions.value === 0) return 1
    return Math.ceil(totalSessions.value / pageSize)
  })

  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  // Vérifie l'unicité et retourne un slug unique en suffixant un numéro si besoin
  async function generateUniqueSlug(baseSlug, attempt = 0) {
    const slugToCheck = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('slug', slugToCheck)
      .single()

    if (error && error.code !== 'PGRST116') {
      // autre erreur SQL; tu peux traiter ici ou relancer
      throw error
    }
    if (!data) {
      // Pas de session avec ce slug, donc unique
      return slugToCheck
    }
    // Slug déjà pris, tente un suffixe supérieur
    return generateUniqueSlug(baseSlug, attempt + 1)
  }

  const sessionQuestionUrl = computed(() =>
    createdSessionSlug.value ? `${window.location.origin}/ask/${createdSessionSlug.value}` : '',
  )

  async function fetchDashboardData() {
    loading.value = true
    errorMsg.value = ''
    try {
      const [sessionsData, statsData] = await Promise.all([
        // charge sessions et stats en parallèle (à adapter selon ton service)
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

    const {
      data: { session: authSession },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !authSession) {
      errorMsg.value = 'Veuillez vous connecter pour créer une session.'
      loading.value = false
      return false
    }

    // Ici, il a droit à 1 session gratuite.
    // S'il en a déjà créé 1+ et n'est pas PREMIUM, bloquer :
    // Il te faut un moyen de récupérer le statut premium dans Supabase (profiles/plan)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, is_premium')
      .eq('id', user.value.id)
      .single()

    if (profileError) {
      errorMsg.value = 'Could not verify user plan'
      loading.value = false
      return false
    }

    if (!profile.is_premium) {
      // Limite pour utilisateurs non premium
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.value.id)

      if (count >= 1) {
        errorUpgradeMessage.value =
          'Limit reached: free users can only create one session. Upgrade to premium to create more.'
        showUpgradePlanModal.value = true
        loading.value = false
        return false
      }
    }

    // Création de session possible…
    // ... ton code habituel ici

    const baseSlug = slugify(sessionName.value)
    const uniqueSlug = await generateUniqueSlug(baseSlug)

    const now = new Date()
    const expirationDate = new Date(now.getTime() + 4 * 60 * 60 * 1000) // Ajoute 4 heures en millisecondes

    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert([
        {
          name: sessionName.value,
          slug: uniqueSlug,
          access_code: accessCode.value || null,
          user_id: authSession.user.id,
          expires_at: expirationDate.toISOString(),
        },
      ])
      .select('id, slug')
      .single()

    loading.value = false

    if (createError) {
      errorMsg.value = createError.message
      return false
    }

    successMsg.value = 'Session créée avec succès !'
    createdSessionId.value = newSession.id
    createdSessionSlug.value = newSession.slug

    sessionName.value = ''
    accessCode.value = ''

    await fetchDashboardData()
    return true
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
  })

  async function handleUpgrade() {
    if (!user.value) {
      alert('Please login first.')
      return false
    }

    loading.value = true
    showModal.value = false

    try {
      const response = await fetch('/api/lemon-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.value.id,
          email: user.value.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      if (data.checkoutUrl) {
        // Rediriger vers Lemon Squeezy
        window.location.href = data.checkoutUrl
        return true
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      errorUpgradeMessage.value = error.message || 'An error occurred. Please try again.'
      showUpgradePlanModal.value = true
      return false
    } finally {
      loading.value = false
    }
  }

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
    handleUpgrade,
  }
})
