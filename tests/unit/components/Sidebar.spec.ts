import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Sidebar from '@/components/layouts/Sidebar.vue'
import { useSessionStore } from '@/stores/sessionStore'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

describe('Sidebar.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the static workspace name', () => {
    const wrapper = mount(Sidebar)
    expect(wrapper.text()).toContain('Personal Workspace')
  })

  it('renders Analytics section with Q&A, Polls, Surveys', () => {
    const wrapper = mount(Sidebar)
    expect(wrapper.text()).toContain('Analytics')
    expect(wrapper.text()).toContain('Q&A')
    expect(wrapper.text()).toContain('Polls')
    expect(wrapper.text()).toContain('Surveys')
  })

  it('renders General section with Integrations, Archive, Trash', () => {
    const wrapper = mount(Sidebar)
    expect(wrapper.text()).toContain('General')
    expect(wrapper.text()).toContain('Integrations')
    expect(wrapper.text()).toContain('Archive')
    expect(wrapper.text()).toContain('Trash')
  })

  it('renders Settings in the footer', () => {
    const wrapper = mount(Sidebar)
    expect(wrapper.text()).toContain('Settings')
  })

  it('changes active tab in store when Archive is clicked', async () => {
    const store = useSessionStore()
    const wrapper = mount(Sidebar)

    const archiveItem = wrapper.findAll('.cursor-pointer').find(el => el.text().includes('Archive'))
    expect(archiveItem?.exists()).toBe(true)

    await archiveItem?.trigger('click')
    expect(store.activeSidebarTab).toBe('archive')
  })

  it('changes active tab in store when Trash is clicked', async () => {
    const store = useSessionStore()
    const wrapper = mount(Sidebar)

    const trashItem = wrapper.findAll('.cursor-pointer').find(el => el.text().includes('Trash'))
    expect(trashItem?.exists()).toBe(true)

    await trashItem?.trigger('click')
    expect(store.activeSidebarTab).toBe('trash')
  })

  it('emits select-tab event when a tab is clicked', async () => {
    const wrapper = mount(Sidebar)

    const archiveItem = wrapper.findAll('.cursor-pointer').find(el => el.text().includes('Archive'))
    await archiveItem?.trigger('click')

    expect(wrapper.emitted('select-tab')).toBeTruthy()
    expect(wrapper.emitted('select-tab')![0]).toEqual(['archive'])
  })

  it('emits open-settings when Settings is clicked', async () => {
    const wrapper = mount(Sidebar)

    const settingsBtn = wrapper.findAll('.cursor-pointer').find(el => el.text().includes('Settings'))
    await settingsBtn?.trigger('click')

    expect(wrapper.emitted('open-settings')).toHaveLength(1)
  })
})
