<script setup>
import { supabase } from '@/lib/supabase'
import { useAuthSotre } from '@/stores/authStore'
import { ref } from 'vue'

const user = ref(null)

const authStore = useAuthSotre()

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null
})

const { logout } = authStore

const handleLogout = async () => {
  const success = await logout()
  if (success) {
    window.location.href = `/login`
  }
}
</script>

<template>
  <div class="px-4">
    <div class="mx-auto max-w-lg mt-8" v-if="user && user.user_metadata">
      <div class="flex items-end justify-between">
        <div class="flex space-x-1 items-center">
          <img
            :src="user.user_metadata.picture"
            alt="profile picture of connected user"
            class="w-9 h-9 rounded-full border border-[#7738C7] mr-2"
          />
          <div class="space-y-1">
            <p class="leading-[100%] text-sm">
              {{ user.user_metadata.name }}
            </p>
            <p class="leading-[100%] text-[11px] text-gray-600">
              {{ user.user_metadata.email }}
            </p>
          </div>
        </div>
        <button @click="handleLogout" class="text-[11px] text-red-700 leading-[100%]">
          Disconnect
        </button>
      </div>
    </div>
  </div>
</template>
