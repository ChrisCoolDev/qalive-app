import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { analytics } from '@/lib/analytics'

export const useAuthStore = defineStore('auth', () => {
  // states
  const loading = ref(false)
  const errorMsg = ref('')
  const isLoggedIn = ref(false)
  const user = ref(null)

  // actions
  async function loginWithGoogle() {
    loading.value = true
    errorMsg.value = ''
    analytics.trackEvent('login_initiated', { provider: 'google' })

    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
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

// Alias rétrocompatible pour éviter toute régression sur d'anciens imports
export const useAuthSotre = useAuthStore
