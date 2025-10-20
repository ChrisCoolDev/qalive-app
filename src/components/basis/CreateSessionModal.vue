<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import { storeToRefs } from 'pinia'

const sessionStore = useSessionStore()

const { sessionName, accessCode, showModal } = storeToRefs(sessionStore)

const { createSession, redirectToSessionQrCode } = sessionStore

const handleCreateSession = async () => {
  const success = await createSession()
  if (success) {
    redirectToSessionQrCode()
  }
}
</script>

<template>
  <form
    @submit.prevent="handleCreateSession"
    class="space-y-4 bg-white rounded-[6px] px-6 py-8 max-w-[350px] w-full relative"
  >
    <div
      @click="showModal = false"
      class="absolute top-3 right-5 text-3xl font-light text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
    >
      <span class="material-symbols-outlined"> close_small </span>
    </div>
    <h2 class="text-lg font-medium text-primary mb-6">Create a new session</h2>
    <div class="">
      <label class="block text-[13px] text-gray-500 mb-1">Session name</label>
      <input
        v-model="sessionName"
        type="text"
        required
        class="w-full p-2 border rounded-[3px] outline-none text-sm"
        :disabled="loading"
      />
    </div>
    <div>
      <label class="block text-[13px] text-gray-500 mb-1">Acces code (optional)</label>
      <input
        v-model="accessCode"
        type="text"
        class="w-full p-2 border rounded-[3px] outline-none text-sm"
        :disabled="loading"
      />
    </div>
    <button
      type="submit"
      class="w-full py-3 px-4 bg-[#7738C7] text-white rounded text-[13px]"
      :disabled="loading"
    >
      {{ loading ? 'Creation...' : 'Create a session' }}
    </button>
  </form>
</template>
