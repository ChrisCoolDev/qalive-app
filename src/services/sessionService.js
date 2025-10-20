export const sessionService = {
  /* Récupère une liste paginée de sessions pour l'utilisateur connecté.
   *Le statut 'is_active' est calculé dynamiquement.*/

  async fetchSessions(page, pageSize, supabase) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const {
      data: { session: authSession },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !authSession) {
      throw new Error('Vous devez être connecté.')
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*, questions(count)')
      .eq('user_id', authSession.user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const now = new Date()
    // Transforme les données pour un usage plus simple
    const sessionsWithCalculatedStatus = sessions.map((session) => {
      const expiresAt = session.expires_at ? new Date(session.expires_at) : null
      return {
        ...session,
        questionCount: session.questions[0]?.count || 0,
        // Calcul dynamique du statut actif
        is_active: expiresAt ? expiresAt > now : true,
      }
    })

    return sessionsWithCalculatedStatus
  },

  /**
   * Récupère les statistiques globales pour le tableau de bord :
   * - Nombre total de sessions.
   * - Nombre total de questions.
   * - Nombre de sessions actuellement actives.
   */
  async fetchDashboardStats(supabase) {
    const {
      data: { session: authSession },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !authSession) {
      throw new Error('Vous devez être connecté.')
    }
    const userId = authSession.user.id

    // Récupérer TOUTES les sessions de l'utilisateur avec la date d'expiration et le décompte des questions
    const { data: allSessions, error } = await supabase
      .from('sessions')
      .select('expires_at, questions(count)')
      .eq('user_id', userId)

    if (error) throw error

    const now = new Date()
    let totalQuestionsCount = 0
    let activeSessionsCount = 0

    // Itérer une seule fois sur toutes les sessions pour calculer les totaux
    for (const session of allSessions) {
      // Calculer le total des questions
      totalQuestionsCount += session.questions[0]?.count || 0

      // Calculer si la session est active
      const expiresAt = session.expires_at ? new Date(session.expires_at) : null
      if (expiresAt ? expiresAt > now : true) {
        activeSessionsCount++
      }
    }

    return {
      totalSessions: allSessions.length,
      totalQuestions: totalQuestionsCount,
      activeSessions: activeSessionsCount,
    }
  },
}
