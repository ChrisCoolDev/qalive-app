import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSessionStore } from '@/stores/sessionStore'

export const useQuestionStore = defineStore('question', () => {
  const questions = ref([])
  const currentSession = ref(null)
  const loading = ref(true)
  const errorMsg = ref('')
  let realtimeChannel = null

  async function fetchQuestions(sessionSlug) {
    loading.value = true
    errorMsg.value = ''
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, name, slug, user_id')
        .eq('slug', sessionSlug)
        .single()

      if (sessionError) throw sessionError
      if (!sessionData) throw new Error('Session non trouvée.')

      currentSession.value = sessionData

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: false })

      if (questionsError) throw questionsError
      questions.value = questionsData
    } catch (err) {
      errorMsg.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function addQuestion(content, authorName = 'Anonymous') {
    const sessionStore = useSessionStore()

    // 🛑 Blocage Free : Max 70 questions
    // Note: Idéalement, isPremium doit être récupéré via une fonction backend sécurisée
    // ou via le store session s'il est initialisé.
    if (!sessionStore.isPremium && questions.value.length >= 70) {
      throw new Error('Cette session a atteint sa limite de questions (Plan Gratuit).')
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([
          {
            content,
            author_name: authorName,
            session_id: currentSession.value.id,
          },
        ])
        .select()
        .single()

      if (error) throw error
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
          questions.value.unshift(payload.new)
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
    errorMsg,
    loading,
    fetchQuestions,
    addQuestion,
    subscribeToQuestions,
    unsubscribeFromQuestions,
  }
})
