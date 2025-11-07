export const sessionService = {
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

    // Récupère l'heure actuelle en UTC
    const nowUTC = new Date()

    const sessionsWithCalculatedStatus = sessions.map((session) => {
      // Parse la date d'expiration (déjà en UTC depuis Supabase)
      const expires = new Date(session.expires_at)
      const expiresAt = expires ? new Date(expires.getTime() + 3 * 60 * 60 * 1000) : null

      return {
        ...session,
        questionCount: session.questions[0]?.count || 0,
        is_active: session.expires_at ? expiresAt > nowUTC : true,
      }
    })

    return sessionsWithCalculatedStatus
  },

  async fetchDashboardStats(supabase) {
    const {
      data: { session: authSession },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !authSession) {
      throw new Error('Vous devez être connecté.')
    }
    const userId = authSession.user.id

    const { data: allSessions, error } = await supabase
      .from('sessions')
      .select('expires_at, questions(count)')
      .eq('user_id', userId)

    if (error) throw error
    const nowUTC = new Date()
    let totalQuestionsCount = 0
    let activeSessionsCount = 0

    for (const session of allSessions) {
      totalQuestionsCount += session.questions[0]?.count || 0

      const expires = new Date(session.expires_at)
      const expiresAt = session.expires_at ? new Date(expires.getTime() + 3 * 60 * 60 * 1000) : null
      if (expiresAt ? expiresAt > nowUTC : true) {
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
