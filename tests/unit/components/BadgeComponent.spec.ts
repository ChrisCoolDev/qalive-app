import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BadgeComponent from '@/components/ui/BadgeComponent.vue'

describe('BadgeComponent.vue', () => {
  it('renders badgeLabel prop correctly', () => {
    const wrapper = mount(BadgeComponent, {
      props: {
        badgeLabel: 'Pro Member',
      },
    })

    expect(wrapper.text()).toContain('Pro Member')
  })
})
