import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'
import { sessionService } from '@/services/sessionService'
import { sessionRepository } from '@/repositories/sessionRepository'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      }),
      onAuthStateChange: vi.fn((cb) => cb('SIGNED_IN', null)),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { is_premium: true, plan: 'premium' }, error: null }),
  },
}))

vi.mock('@/services/sessionService', () => ({
  sessionService: {
    fetchSessions: vi.fn(),
    fetchDashboardStats: vi.fn(),
  },
}))

vi.mock('@/repositories/sessionRepository', () => ({
  sessionRepository: {
    checkSlugExists: vi.fn(),
    insertSession: vi.fn(),
    deleteSession: vi.fn(),
    uploadLogo: vi.fn(),
  },
}))

describe('sessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default states', () => {
    const store = useSessionStore()
    expect(store.sessions).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.page).toBe(1)
  })

  it('fetchDashboardData sets premium status and gets sessions and stats', async () => {
    const store = useSessionStore()
    
    const mockSessions = [{ id: 1, name: 'S1', isActive: true, createdAt: '...', slug: 's1', accessCode: null, userId: 'user-123' }]
    const mockStats = { totalSessions: 1, totalQuestions: 5, activeSessions: 1 }

    vi.mocked(sessionService.fetchSessions).mockResolvedValue(mockSessions)
    vi.mocked(sessionService.fetchDashboardStats).mockResolvedValue(mockStats)

    const result = await store.fetchDashboardData()

    expect(result).toBe(true)
    expect(store.isPremium).toBe(true)
    expect(store.userPlan).toBe('premium')
    expect(store.sessions).toEqual(mockSessions)
    expect(store.totalSessions).toBe(1)
    expect(store.totalQuestions).toBe(5)
    expect(store.activeSessions).toBe(1)
    expect(store.loading).toBe(false)
  })

  it('createSession handles successful creation and updates dashboard', async () => {
    const store = useSessionStore()
    store.sessionName = 'My New Session'
    store.isPremium = true

    vi.mocked(sessionRepository.checkSlugExists).mockResolvedValue(null) // slug is unique
    vi.mocked(sessionRepository.insertSession).mockResolvedValue({ id: 99, slug: 'my-new-session' })
    vi.mocked(sessionService.fetchSessions).mockResolvedValue([])
    vi.mocked(sessionService.fetchDashboardStats).mockResolvedValue({ totalSessions: 0, totalQuestions: 0, activeSessions: 0 })

    const result = await store.createSession()

    expect(result).toBe(true)
    expect(store.successMsg).toBe('Session créée avec succès !')
    expect(store.createdSessionId).toBe(99)
    expect(store.createdSessionSlug).toBe('my-new-session')
    expect(sessionService.fetchSessions).toHaveBeenCalled()
  })

  it('deleteSession calls repository and updates dashboard', async () => {
    const store = useSessionStore()
    store.isPremium = true
    
    vi.mocked(sessionRepository.deleteSession).mockResolvedValue(true)
    vi.mocked(sessionService.fetchSessions).mockResolvedValue([])
    vi.mocked(sessionService.fetchDashboardStats).mockResolvedValue({ totalSessions: 0, totalQuestions: 0, activeSessions: 0 })

    await store.deleteSession(42)

    expect(sessionRepository.deleteSession).toHaveBeenCalledWith(supabase, 42)
    expect(sessionService.fetchSessions).toHaveBeenCalled()
  })
})
