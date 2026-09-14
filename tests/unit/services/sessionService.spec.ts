import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sessionService } from '@/services/sessionService'
import { sessionRepository } from '@/repositories/sessionRepository'

vi.mock('@/repositories/sessionRepository', () => ({
  sessionRepository: {
    getSessions: vi.fn(),
    getAllSessionsForStats: vi.fn(),
  },
}))

describe('sessionService', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      }),
    },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchSessions parses database sessions and calculates isActive status', async () => {
    const mockSessionsFromDb = [
      {
        id: 1,
        slug: 'session-1',
        created_at: '2026-08-27T00:00:00Z',
        name: 'Session 1',
        expires_at: new Date(Date.now() + 100000).toISOString(), // future expiration
        user_id: 'user-123',
        logo_url: null,
        questions: [{ count: 5 }],
      },
      {
        id: 2,
        slug: 'session-2',
        created_at: '2026-08-27T00:00:00Z',
        name: 'Session 2',
        expires_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // past expiration (more than 3h)
        user_id: 'user-123',
        logo_url: 'logo.png',
        questions: [],
      },
    ]

    vi.mocked(sessionRepository.getSessions).mockResolvedValue(mockSessionsFromDb)

    const result = await sessionService.fetchSessions(1, 5, mockSupabase)

    expect(sessionRepository.getSessions).toHaveBeenCalledWith(mockSupabase, 'user-123', 0, 4)
    expect(result).toHaveLength(2)

    // Check first session (future expires_at -> isActive = true)
    expect(result[0].id).toBe(1)
    expect(result[0].isActive).toBe(true)
    expect(result[0].questionCount).toBe(5)

    // Check second session (past expires_at -> isActive = false)
    expect(result[1].id).toBe(2)
    expect(result[1].isActive).toBe(false)
    expect(result[1].questionCount).toBe(0)
    expect(result[1].logoUrl).toBe('logo.png')
  })

  it('fetchDashboardStats aggregates stats correctly', async () => {
    const mockStatsSessions = [
      {
        expires_at: new Date(Date.now() + 100000).toISOString(),
        questions: [{ count: 3 }],
      },
      {
        expires_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        questions: [{ count: 7 }],
      },
    ]

    vi.mocked(sessionRepository.getAllSessionsForStats).mockResolvedValue(mockStatsSessions)

    const stats = await sessionService.fetchDashboardStats(mockSupabase)

    expect(sessionRepository.getAllSessionsForStats).toHaveBeenCalledWith(mockSupabase, 'user-123')
    expect(stats.totalSessions).toBe(2)
    expect(stats.totalQuestions).toBe(10)
    expect(stats.activeSessions).toBe(1) // only the first one is active
  })
})
