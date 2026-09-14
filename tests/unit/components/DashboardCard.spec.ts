import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardCard from '@/components/ui/DashboardCard.vue'

describe('DashboardCard.vue', () => {
  it('renders dashboardInformation properties correctly', () => {
    const info = {
      icon: '<span class="test-icon">svg</span>',
      name: 'Active Sessions',
      label: 'Currently active Q&A rooms',
      statistic: 12,
    }

    const wrapper = mount(DashboardCard, {
      props: {
        dashboardInformation: info,
      },
    })

    expect(wrapper.find('.test-icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('Active Sessions')
    expect(wrapper.text()).toContain('Currently active Q&A rooms')
    expect(wrapper.text()).toContain('12')
  })
})
