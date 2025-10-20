<script setup>
import { supabase } from '@/lib/supabase'
import VueQrcode from 'qrcode.vue'
import { useSessionStore } from '@/stores/sessionStore'
import { storeToRefs } from 'pinia'

const sessionStore = useSessionStore()

const { errorMsg, successMsg, createdSessionId, user, sessionQuestionUrl } =
  storeToRefs(sessionStore)

// Auth state listener
supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null
})
</script>

<template>
  <div class="max-w-lg mx-auto mt-12 p-8 rounded shadow bg-white space-y-8">
    <p v-if="errorMsg" class="text-red-600 text-center">{{ errorMsg }}</p>
    <p v-if="successMsg" class="text-green-700 text-center">{{ successMsg }}</p>

    <div v-if="createdSessionId" class="text-center space-y-4 mt-6">
      <h2 class="text-lg font-semibold">QR Code à partager</h2>
      <vue-qrcode :value="sessionQuestionUrl" :size="220" />
      <div class="mt-2">
        <span class="font-mono text-gray-700">{{ sessionQuestionUrl }}</span>
      </div>
    </div>
  </div>
</template>
