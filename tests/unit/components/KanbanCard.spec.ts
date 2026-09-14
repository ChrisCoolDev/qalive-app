import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import KanbanCard from '@/components/features/KanbanCard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/session/:slug', component: { template: '<div>D</div>' } },
    { path: '/session/:slug/qrcode', component: { template: '<div>Q</div>' } }
  ],
})

describe('KanbanCard.vue', () => {
  it('renders card information correctly', async () => {
    const session = {
      id: 99,
      name: 'Notion Redesign Sync',
      createdAt: '2026-08-27T00:00:00Z',
      isActive: true,
      slug: 'notion-redesign-sync',
      accessCode: null,
      userId: 'user-123',
      questionCount: 7,
      is_active: true
    }

    router.push('/')
    await router.isReady()

    const wrapper = mount(KanbanCard, {
      global: {
        plugins: [router]
      },
      props: {
        session
      }
    })

    expect(wrapper.text()).toContain('Notion Redesign Sync')
    expect(wrapper.text()).toContain('#notion-redesign-sync')
    expect(wrapper.text()).toContain('Questions')
    expect(wrapper.text()).toContain('7')
    expect(wrapper.text()).toContain('27 août 2026')
    expect(wrapper.text()).toContain('Live')
  })

  it('emits delete event when delete button clicked', async () => {
    const session = {
      id: 99,
      name: 'Notion Redesign Sync',
      createdAt: '2026-08-27T00:00:00Z',
      isActive: true,
      slug: 'notion-redesign-sync',
      accessCode: null,
      userId: 'user-123',
      questionCount: 7,
      is_active: true
    }

    router.push('/')
    await router.isReady()

    const wrapper = mount(KanbanCard, {
      global: {
        plugins: [router]
      },
      props: {
        session
      }
    })

    const deleteBtn = wrapper.find('button[title="Delete session"]')
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual([99])
  })
})
