<script setup lang="ts">
import SessionSideBar from '@/components/layouts/SessionSideBar.vue'
import Sidebar from '@/components/layouts/Sidebar.vue'
import TopBar from '@/components/layouts/TopBar.vue'
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

const handleSelectTab = (tab: string) => {
  // Can trigger workspace/filter changes if needed globally
}

const handleOpenSettings = () => {
  // Settings modal trigger
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-white">
    <!-- Left Sidebar (only when logged in) -->
    <Sidebar
      v-if="isLoggedIn"
      @select-tab="handleSelectTab"
      @open-settings="handleOpenSettings"
    />

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto h-full bg-white">
      <TopBar />
      <div class="p-6 md:p-10 md:pt-[26px] max-w-6xl mx-auto">
        <slot></slot>
      </div>
      <SessionSideBar />
    </main>
  </div>
</template>
