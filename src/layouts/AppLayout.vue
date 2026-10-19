<script setup lang="ts">
import SessionSideBar from '@/components/layouts/SessionSideBar.vue'
import Sidebar from '@/components/layouts/Sidebar.vue'
import TopBar from '@/components/layouts/TopBar.vue'
import CreateSessionModal from '@/components/features/CreateSessionModal.vue'
import ShareSessionModal from '@/components/features/ShareSessionModal.vue'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

const sessionStore = useSessionStore()
const { showModal, showShareModal, shareModalSession } = storeToRefs(sessionStore)

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

    <!-- Create Session modal (opened from the sidebar "Create a new session" button) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showModal"
          @click.self="showModal = false"
          class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <CreateSessionModal />
        </div>
      </Transition>
    </Teleport>

    <!-- Share Session / QR Code modal (opened after creation or via openShareModal) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showShareModal && shareModalSession"
          @click.self="sessionStore.closeShareModal()"
          class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4"
        >
          <ShareSessionModal
            :session="shareModalSession"
            @close="sessionStore.closeShareModal()"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
