import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarFooter from '@/components/layouts/sidebar/SidebarFooter.vue'

describe('SidebarFooter.vue', () => {
  it('renders the Settings label', () => {
    const wrapper = mount(SidebarFooter)
    expect(wrapper.text()).toContain('Settings')
  })

  it('renders the settings icon SVG', () => {
    const wrapper = mount(SidebarFooter)
    expect(wrapper.find('svg').exists()).toBe(true)
    // Settings icon has 2 paths (gear + inner circle)
    expect(wrapper.findAll('path').length).toBe(2)
  })

  it('emits open-settings when clicked', async () => {
    const wrapper = mount(SidebarFooter)
    const clickable = wrapper.find('.cursor-pointer')
    await clickable.trigger('click')
    expect(wrapper.emitted('open-settings')).toHaveLength(1)
  })

  it('has the border-top separator', () => {
    const wrapper = mount(SidebarFooter)
    const root = wrapper.find('div')
    expect(root.classes()).toContain('border-t')
  })
})
