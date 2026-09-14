import { describe, it, expect, vi } from 'vitest'
import { sessionRepository } from '@/repositories/sessionRepository'

describe('sessionRepository', () => {
  it('should fetch sessions correctly', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Session 1' }], error: null })
    } as any

    const data = await sessionRepository.getSessions(mockSupabase, 'user-123', 0, 4)

    expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    expect(mockSupabase.select).toHaveBeenCalledWith('*, questions(count)')
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockSupabase.range).toHaveBeenCalledWith(0, 4)
    expect(data).toEqual([{ id: 1, name: 'Session 1' }])
  })

  it('should get all sessions for stats', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [{ expires_at: '2026-08-27T00:00:00Z', questions: [{ count: 3 }] }], error: null })
    } as any

    const data = await sessionRepository.getAllSessionsForStats(mockSupabase, 'user-123')

    expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    expect(mockSupabase.select).toHaveBeenCalledWith('expires_at, questions(count)')
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(data).toEqual([{ expires_at: '2026-08-27T00:00:00Z', questions: [{ count: 3 }] }])
  })

  it('should check if slug exists', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
    } as any

    const data = await sessionRepository.checkSlugExists(mockSupabase, 'test-slug')

    expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    expect(mockSupabase.select).toHaveBeenCalledWith('id')
    expect(mockSupabase.eq).toHaveBeenCalledWith('slug', 'test-slug')
    expect(mockSupabase.single).toHaveBeenCalled()
    expect(data).toEqual({ id: 1 })
  })

  it('should insert a session', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 1, slug: 'test' }, error: null })
    } as any

    const sessionData = {
      name: 'Test',
      slug: 'test',
      access_code: null,
      user_id: 'user-123',
      expires_at: '2026-08-27T00:00:00Z',
      logo_url: null
    }

    const data = await sessionRepository.insertSession(mockSupabase, sessionData)

    expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    expect(mockSupabase.insert).toHaveBeenCalledWith([sessionData])
    expect(mockSupabase.select).toHaveBeenCalledWith('id, slug')
    expect(mockSupabase.single).toHaveBeenCalled()
    expect(data).toEqual({ id: 1, slug: 'test' })
  })

  it('should delete a session', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null })
    } as any

    const success = await sessionRepository.deleteSession(mockSupabase, 42)

    expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 42)
    expect(success).toBe(true)
  })
})
