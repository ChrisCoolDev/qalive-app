import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarSection from '@/components/layouts/sidebar/SidebarSection.vue'

describe('SidebarSection.vue', () => {
  it('renders the section title', () => {
    const wrapper = mount(SidebarSection, {
      props: { title: 'Analytics' },
    })
    expect(wrapper.find('p').text()).toBe('Analytics')
  })

  it('applies correct title styling classes', () => {
    const wrapper = mount(SidebarSection, {
      props: { title: 'General' },
    })
    const title = wrapper.find('p')
    expect(title.classes()).toContain('text-[12px]')
    expect(title.classes()).toContain('px-2.5')
    expect(title.classes()).toContain('text-[#262523]')
  })

  it('renders slot content', () => {
    const wrapper = mount(SidebarSection, {
      props: { title: 'Analytics' },
      slots: {
        default: '<div class="test-slot">Slot Content</div>',
      },
    })
    expect(wrapper.find('.test-slot').exists()).toBe(true)
    expect(wrapper.text()).toContain('Slot Content')
  })

  it('renders empty when no slot content is provided', () => {
    const wrapper = mount(SidebarSection, {
      props: { title: 'Empty Section' },
    })
    expect(wrapper.find('p').text()).toBe('Empty Section')
    // The items container should exist but be empty
    const itemsContainer = wrapper.findAll('div').at(1)
    expect(itemsContainer?.element.children.length).toBe(0)
  })
})
