import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const loading = ref(false)
  const errorMsg = ref('')
  const isLoggedIn = ref(false)
  const user = ref<any>(null)

  async function loginWithGoogle() {
    loading.value = true
    errorMsg.value = ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) {
      errorMsg.value = error.message
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    isLoggedIn.value = false
    return true
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user ?? null
    isLoggedIn.value = !!user.value
    loading.value = false
  })

  return {
    errorMsg,
    user,
    isLoggedIn,
    loading,
    loginWithGoogle,
    logout,
  }
})

// Alias for backward compatibility/restructured views
export const useAuthSotre = useAuthStore
