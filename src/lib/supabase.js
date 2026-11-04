import { createClient } from '@supabase/supabase-js'
import { cleanAuthUrl } from '@/utils/urlHelper'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Nettoyage immédiat et automatique des tokens Supabase de la barre d'adresse
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
      cleanAuthUrl()
    }
  })
}

