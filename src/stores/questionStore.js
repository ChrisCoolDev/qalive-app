import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSessionStore } from '@/stores/sessionStore'
import { parseUTCDate } from '@/utils/dateHelper'
import { analytics } from '@/lib/analytics'

export const FREE_QUESTION_LIMIT = 15

export const useQuestionStore = defineStore('question', () => {
  const questions = ref([])
  const currentSession = ref(null)
  const isOwnerPremium = ref(false)
  const loading = ref(true)
  const errorMsg = ref('')
  let realtimeChannel = null

  async function fetchQuestions(sessionSlug) {
    loading.value = true
    errorMsg.value = ''
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, name, slug, user_id, expires_at, logo_url')
        .eq('slug', sessionSlug)
        .single()

      if (sessionError) throw sessionError
      if (!sessionData) throw new Error('Session non trouvée.')

      currentSession.value = sessionData

      // Récupérer le statut Pro du créateur de la session
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('is_premium, plan')
        .eq('id', sessionData.user_id)
        .maybeSingle()

      if (ownerProfile) {
        isOwnerPremium.value =
          Boolean(ownerProfile.is_premium) ||
          ['pro', 'premium', 'premium_plus', 'cancelled_pro'].includes(ownerProfile.plan)
      } else {
        const sessionStore = useSessionStore()
        isOwnerPremium.value = Boolean(sessionStore.isPremium)
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: false })

      if (questionsError) throw questionsError
      questions.value = questionsData || []
    } catch (err) {
      errorMsg.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function addQuestion(content, authorName = 'Anonymous') {
    if (!currentSession.value?.id) {
      throw new Error('Session invalide.')
    }

    // 1. Vérifier l'expiration
    const expiresAt = parseUTCDate(currentSession.value.expires_at)
    if (expiresAt && new Date() > expiresAt) {
      throw new Error('Impossible de soumettre, la session est terminée.')
    }

    // 2. Vérifier la limite de 15 questions sur le plan Gratuit
    if (!isOwnerPremium.value && questions.value.length >= FREE_QUESTION_LIMIT) {
      analytics.trackEvent('question_limit_reached', { session_id: currentSession.value.id })
      throw new Error(`Cette session a atteint sa limite de ${FREE_QUESTION_LIMIT} questions (Plan Gratuit).`)
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([
          {
            content,
            author_name: authorName || null,
            session_id: currentSession.value.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      analytics.trackEvent('question_submitted', {
        session_id: currentSession.value.id,
        slug: currentSession.value.slug,
      })

      return data
    } catch (err) {
      errorMsg.value = err.message
      throw err
    }
  }

  function subscribeToQuestions(sessionId) {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel)

    realtimeChannel = supabase
      .channel(`questions:session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'questions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const exists = questions.value.some((q) => q.id === payload.new.id)
          if (!exists) {
            questions.value.unshift(payload.new)
          }
        },
      )
      .subscribe()
  }

  function unsubscribeFromQuestions() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  return {
    questions,
    currentSession,
    isOwnerPremium,
    errorMsg,
    loading,
    fetchQuestions,
    addQuestion,
    subscribeToQuestions,
    unsubscribeFromQuestions,
  }
})
