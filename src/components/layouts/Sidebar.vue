<script setup lang="ts">
import { useSessionStore } from '@/stores/sessionStore'
import { storeToRefs } from 'pinia'
import SidebarNavItem from './sidebar/SidebarNavItem.vue'
import SidebarSection from './sidebar/SidebarSection.vue'
import SidebarFooter from './sidebar/SidebarFooter.vue'
import SidebarCreateNewSession from './sidebar/SidebarCreateNewSession.vue'

const emit = defineEmits<{
  (e: 'select-tab', tab: 'overview' | 'archive' | 'trash'): void
  (e: 'open-settings'): void
}>()

const sessionStore = useSessionStore()
const { activeSidebarTab: activeTab } = storeToRefs(sessionStore)

const selectTab = (tab: 'overview' | 'archive' | 'trash') => {
  activeTab.value = tab
  emit('select-tab', tab)
}
</script>

<template>
  <div class="w-[260px] h-screen bg-[#FCFAF8] flex flex-col justify-between select-none font-sans text-[#37352f]">
    <!-- Top Nav Section -->
    <div class="py-2.5 px-2.5 space-y-4">
      <!-- Static Workspace Header -->
      <div class="flex items-center space-x-2.5 min-w-0 p-1.5">
        <div class="w-[22px] h-[22px] rounded-[4px] flex items-center justify-center bg-[#EAE9E5]">
          <span class="text-[13px]">N</span>
        </div>
        <span class="text-[14px] font-[SF-Medium] text-[#37352f] truncate">Personal Workspace</span>
      </div>

      <SidebarCreateNewSession class="pb-3 pt-2"/>

      <!-- Navigation Links -->
      <div class="space-y-[30px]">
        <SidebarSection title="Analytics">
          <SidebarNavItem icon="qa" label="Q&A" :count="1" />
          <SidebarNavItem icon="polls" label="Polls" :count="1" />
          <SidebarNavItem icon="surveys" label="Surveys" :count="0" />
        </SidebarSection>

        <SidebarSection title="General">
          <SidebarNavItem icon="integrations" label="Integrations" />
          <SidebarNavItem
            icon="archive"
            label="Archive"
            :is-active="activeTab === 'archive'"
            @click="selectTab('archive')"
          />
          <SidebarNavItem
            icon="trash"
            label="Trash"
            :is-active="activeTab === 'trash'"
            @click="selectTab('trash')"
          />
        </SidebarSection>
      </div>
    </div>

    <!-- Bottom Settings Section -->
    <SidebarFooter @open-settings="emit('open-settings')" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
