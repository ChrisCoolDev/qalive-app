import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useQuestionStore = defineStore('question', () => {
  const questions = ref([])
  const currentSession = ref(null)
  const loading = ref(true)
  const errorMsg = ref('')

  async function fetchQuestions(sessionSlug) {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, name, slug')
        .eq('slug', sessionSlug)
        .single()

      if (sessionError) throw sessionError
      if (!sessionData) throw new Error('Session non trouvée.')

      currentSession.value = sessionData

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', sessionData.id) // utilise l’id récupéré via le slug
        .order('created_at', { ascending: false })

      if (questionsError) throw questionsError
      questions.value = questionsData
    } catch (err) {
      errorMsg.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    questions,
    currentSession,
    errorMsg,
    loading,

    fetchQuestions,
  }
})
