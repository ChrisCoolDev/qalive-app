import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { sessionService } from '@/services/sessionService'

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
  const isPremium = ref(false) // Le statut clé
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
  const sessionLogoFile = ref(null) // Fichier image (Pro)

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

  /**
   * Upload l'image dans le bucket 'session-logos'
   */
  async function uploadLogo(file, userId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}` // Chemin: userId/timestamp.jpg

    const { error: uploadError } = await supabase.storage
      .from('sessions-logos')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from('sessions-logos').getPublicUrl(fileName)

    return publicUrl
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
    } catch (err) {
      errorMsg.value = err.message || 'Une erreur est survenue.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function createSession() {
    // 🛑 Blocage Free : Max 3 sessions
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

      // ⏱️ Gestion Durée : Custom si Pro, sinon 2h fixes
      const finalDurationMs = isPremium.value
        ? customDuration.value * 60 * 60 * 1000
        : FREE_SESSION_DURATION_MS

      const expiresAt = new Date(Date.now() + finalDurationMs).toISOString()

      // 🖼️ Gestion Logo : Upload si Pro et fichier présent
      let logoUrl = null
      if (isPremium.value && sessionLogoFile.value) {
        logoUrl = await uploadLogo(sessionLogoFile.value, userId)
      }

      // Insert DB
      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert([
          {
            name: sessionName.value,
            slug: uniqueSlug,
            access_code: accessCode.value || null,
            user_id: userId,
            expires_at: expiresAt,
            logo_url: logoUrl, // Nouvelle colonne
          },
        ])
        .select('id, slug')
        .single()

      if (createError) throw createError

      successMsg.value = 'Session créée avec succès !'
      createdSessionId.value = newSession.id
      createdSessionSlug.value = newSession.slug

      // Reset Form
      sessionName.value = ''
      accessCode.value = ''
      customDuration.value = 2
      sessionLogoFile.value = null // Reset fichier

      await fetchDashboardData()
      return true
    } catch (err) {
      errorMsg.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // 🗑️ Suppression (Pro Only)
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
    sessionLogoFile, // Export nécessaire pour le modal
    createdSessionId,
    createdSessionSlug,
    user,
    totalPages,
    sessionQuestionUrl,
    isPremium, // Export pour l'UI

    fetchDashboardData,
    createSession,
    deleteSession,
    nextPage,
    prevPage,
    redirectToSessionQrCode,
  }
})
