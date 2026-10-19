import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SharedFilePopover from '@/components/layouts/SessionSideBar/SharedFilePopover.vue'
import { useFileStore } from '@/stores/fileStore'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}))

describe('SharedFilePopover.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders trigger button and opens popover on click', async () => {
    const wrapper = mount(SharedFilePopover)

    expect(wrapper.text()).toContain('Shared files')
    expect(wrapper.find('input[placeholder="Type a file name..."]').exists()).toBe(false)

    // Click trigger to open
    await wrapper.find('.cursor-pointer').trigger('click')

    expect(wrapper.find('input[placeholder="Type a file name..."]').exists()).toBe(true)
  })

  it('displays empty state when there are no files (Figma state)', async () => {
    const fileStore = useFileStore()
    fileStore.files = []

    const wrapper = mount(SharedFilePopover)
    await wrapper.find('.cursor-pointer').trigger('click')

    // Verifying Empty state elements
    expect(wrapper.text()).toContain('Files')
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('Not shared file now')
    expect(wrapper.text()).toContain('Share a new file')
  })

  it('displays file list when files are present', async () => {
    const fileStore = useFileStore()
    fileStore.files = [
      {
        id: '1',
        session_id: 'session-1',
        file_name: 'How to get away with murder',
        file_url: 'https://example.com/file.pdf',
        file_size: 1024,
        file_type: 'application/pdf',
      },
    ]

    const wrapper = mount(SharedFilePopover)
    await wrapper.find('.cursor-pointer').trigger('click')

    expect(wrapper.text()).toContain('Files')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('How to get away with murder')
    expect(wrapper.text()).not.toContain('Not shared file now')
  })

  it('disables file upload and indicates expiration when session is expired', async () => {
    const sessionStore = (await import('@/stores/sessionStore')).useSessionStore()
    sessionStore.selectedSession = {
      id: 1,
      name: 'Expired Session',
      isActive: false,
      is_active: false,
      createdAt: new Date().toISOString(),
      slug: 'expired-session',
      accessCode: null,
      userId: 'user-1',
    }

    const wrapper = mount(SharedFilePopover)
    await wrapper.find('.cursor-pointer').trigger('click')

    const button = wrapper.find('button')
    expect(button.text()).toContain('Session expired')
    expect(button.attributes('disabled')).toBeDefined()

    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.attributes('disabled')).toBeDefined()
  })
})
