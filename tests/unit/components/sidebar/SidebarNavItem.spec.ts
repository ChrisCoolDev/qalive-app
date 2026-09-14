import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarNavItem from '@/components/layouts/sidebar/SidebarNavItem.vue'

describe('SidebarNavItem.vue', () => {
  const defaultProps = {
    icon: 'qa',
    label: 'Q&A',
  }

  it('renders the label text', () => {
    const wrapper = mount(SidebarNavItem, { props: defaultProps })
    expect(wrapper.text()).toContain('Q&A')
  })

  it('renders the SVG icon for a known icon key', () => {
    const wrapper = mount(SidebarNavItem, { props: defaultProps })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('path').exists()).toBe(true)
  })

  it('displays the counter when count prop is provided', () => {
    const wrapper = mount(SidebarNavItem, {
      props: { ...defaultProps, count: 5 },
    })
    const counter = wrapper.find('p')
    expect(counter.exists()).toBe(true)
    expect(counter.text()).toBe('5')
  })

  it('does not display a counter when count prop is omitted', () => {
    const wrapper = mount(SidebarNavItem, { props: defaultProps })
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('displays counter even when count is 0', () => {
    const wrapper = mount(SidebarNavItem, {
      props: { ...defaultProps, count: 0 },
    })
    const counter = wrapper.find('p')
    expect(counter.exists()).toBe(true)
    expect(counter.text()).toBe('0')
  })

  it('applies active styles when isActive is true', () => {
    const wrapper = mount(SidebarNavItem, {
      props: { ...defaultProps, isActive: true },
    })
    const root = wrapper.find('div')
    expect(root.classes()).toContain('bg-[#FFF0E5]')
    expect(root.classes()).toContain('text-[#9D250F]')
  })

  it('applies default styles when isActive is false', () => {
    const wrapper = mount(SidebarNavItem, {
      props: { ...defaultProps, isActive: false },
    })
    const root = wrapper.find('div')
    expect(root.classes()).toContain('text-[#262523]')
    expect(root.classes()).not.toContain('bg-[#FFF0E5]')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(SidebarNavItem, { props: defaultProps })
    await wrapper.find('div').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('renders multiple paths for icons with multiple paths', () => {
    const wrapper = mount(SidebarNavItem, {
      props: { icon: 'settings', label: 'Settings' },
    })
    const paths = wrapper.findAll('path')
    expect(paths.length).toBe(2)
  })
})
