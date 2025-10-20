import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthSotre = defineStore('auth', () => {
  //states
  const loading = ref(false)
  const errorMsg = ref('')
  const isLoggedIn = ref(false)
  const user = ref(null)

  //actions
  async function loginWithGoogle() {
    loading.value = true
    errorMsg.value = ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://app.qalive.ink',
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

  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event)
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
