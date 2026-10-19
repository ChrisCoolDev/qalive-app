import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import KanbanCard from '@/components/features/KanbanCard.vue'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(),
    },
  },
}))

const NOW = new Date(2026, 9, 14, 12, 0) // Wed 14/10/2026 12:00 (local)

const baseSession = {
  id: 99,
  name: 'Conf Google I/O Berlin 2027',
  description: 'The yearly Google i/o berlin for developers',
  createdAt: '2026-08-27T00:00:00Z',
  isActive: true,
  is_active: true,
  slug: 'conf-google-io',
  accessCode: null,
  expiresAt: null,
  userId: 'user-123',
  questionCount: 7,
  type: 'qna' as const,
}

const mountCard = (session: Record<string, unknown>) =>
  mount(KanbanCard, {
    attachTo: document.body,
    props: { session: { ...baseSession, ...session } as any },
  })

describe('KanbanCard.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders card information correctly', () => {
    const wrapper = mountCard({})
    expect(wrapper.text()).toContain('Conf Google I/O Berlin 2027')
    expect(wrapper.text()).toContain('The yearly Google i/o berlin for developers')
    expect(wrapper.text()).toContain('7')
    expect(wrapper.text()).toContain('Q&A')
  })

  it('shows "Today - Live" in green for a live session', () => {
    const wrapper = mountCard({})
    const label = wrapper.findAll('span').find((s) => s.text() === 'Today - Live')
    expect(label?.exists()).toBe(true)
    expect(label?.attributes('style')).toContain('#1A772D')
  })

  it('shows the weekday in purple when the session starts within a week', () => {
    const startsAt = new Date(2026, 9, 16, 17, 0).toISOString() // Friday 17:00
    const wrapper = mountCard({ startsAt, starts_at: startsAt })
    const label = wrapper.findAll('span').find((s) => s.text() === 'Friday - 17:00')
    expect(label?.exists()).toBe(true)
    expect(label?.attributes('style')).toContain('#633F99')
  })

  it('shows the full date in #666 when the session is more than a week away', () => {
    const startsAt = new Date(2026, 11, 12, 17, 0).toISOString()
    const wrapper = mountCard({ startsAt, starts_at: startsAt })
    const label = wrapper.findAll('span').find((s) => s.text() === '12/12/2026 - 17:00')
    expect(label?.exists()).toBe(true)
    expect(label?.attributes('style')).toContain('#666666')
  })

  it('emits delete / archive from the "..." menu', async () => {
    const wrapper = mountCard({})

    await wrapper.find('#session-card-actions-99').trigger('click')
    await wrapper.find('#session-card-delete-99').trigger('click')
    expect(wrapper.emitted('delete')?.[0]).toEqual([99])

    await wrapper.find('#session-card-actions-99').trigger('click')
    await wrapper.find('#session-card-archive-99').trigger('click')
    expect(wrapper.emitted('archive')?.[0]).toEqual([99])

    wrapper.unmount()
  })
})
