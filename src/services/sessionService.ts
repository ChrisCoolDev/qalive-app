import type { SupabaseClient } from '@supabase/supabase-js'
import { sessionRepository } from '@/repositories/sessionRepository'
import type { Session, DashboardStats } from '@/types'

export const sessionService = {
  async fetchSessions(page: number, pageSize: number, supabase: SupabaseClient): Promise<Session[]> {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const {
      data: { session: authSession },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !authSession) {
      throw new Error('Vous devez être connecté.')
    }

    const sessions = await sessionRepository.getSessions(
      supabase,
      authSession.user.id,
      from,
      to
    )

    const nowUTC = new Date()

    return sessions.map((session: any) => {
      const expires = session.expires_at ? new Date(session.expires_at) : null
      const expiresAt = expires ? new Date(expires.getTime() + 3 * 60 * 60 * 1000) : null

      return {
        id: session.id,
        slug: session.slug,
        createdAt: session.created_at,
        created_at: session.created_at,
        name: session.name,
        isActive: session.expires_at ? (expiresAt ? expiresAt > nowUTC : true) : true,
        is_active: session.expires_at ? (expiresAt ? expiresAt > nowUTC : true) : true,
        accessCode: session.access_code,
        access_code: session.access_code,
        expiresAt: session.expires_at,
        expires_at: session.expires_at,
        userId: session.user_id,
        user_id: session.user_id,
        logoUrl: session.logo_url,
        logo_url: session.logo_url,
        questionCount: session.questions?.[0]?.count || 0,
      }
    })
  },

  async fetchDashboardStats(supabase: SupabaseClient): Promise<DashboardStats> {
    const {
      data: { session: authSession },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !authSession) {
      throw new Error('Vous devez être connecté.')
    }

    const userId = authSession.user.id
    const allSessions = await sessionRepository.getAllSessionsForStats(supabase, userId)
    
    const nowUTC = new Date()
    let totalQuestionsCount = 0
    let activeSessionsCount = 0

    for (const session of allSessions) {
      totalQuestionsCount += (session.questions as any)?.[0]?.count || 0

      const expires = session.expires_at ? new Date(session.expires_at) : null
      const expiresAt = expires ? new Date(expires.getTime() + 3 * 60 * 60 * 1000) : null
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
