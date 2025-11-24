import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useQuestionStore = defineStore('question', () => {
  const questions = ref([])
  const currentSession = ref(null)
  const loading = ref(true)
  const errorMsg = ref('')

  // 🆕 Variable pour stocker le canal de subscription
  let realtimeChannel = null

  // Fonction existante : récupère les questions initiales
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

  // 🆕 Fonction pour s'abonner aux nouvelles questions en temps réel
  function subscribeToQuestions(sessionId) {
    // Si un canal existe déjà, le nettoyer d'abord
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
    }

    // Créer un nouveau canal pour écouter les INSERT sur la table questions
    realtimeChannel = supabase
      .channel(`questions:session_${sessionId}`) // Nom unique du canal
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // On écoute uniquement les nouvelles insertions
          schema: 'public',
          table: 'questions',
          filter: `session_id=eq.${sessionId}`, // Filtre sur la session courante
        },
        (payload) => {
          console.log('📩 Nouvelle question reçue:', payload.new)

          // Ajouter la nouvelle question au début du tableau
          questions.value.unshift(payload.new)
        },
      )
      .subscribe((status) => {
        console.log('📡 Statut de la subscription:', status)
      })
  }

  // 🆕 Fonction pour se désabonner (nettoyage)
  function unsubscribeFromQuestions() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
      console.log('🔌 Déconnexion du canal temps réel')
    }
  }

  return {
    questions,
    currentSession,
    errorMsg,
    loading,

    fetchQuestions,
    subscribeToQuestions, // 🆕 Export
    unsubscribeFromQuestions, // 🆕 Export
  }
})
