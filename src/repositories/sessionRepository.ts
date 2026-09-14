import type { SupabaseClient } from '@supabase/supabase-js'

export const sessionRepository = {
  async getSessions(supabase: SupabaseClient, userId: string, from: number, to: number) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, questions(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return data || []
  },

  async getAllSessionsForStats(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('expires_at, questions(count)')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  },

  async checkSlugExists(supabase: SupabaseClient, slugToCheck: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('slug', slugToCheck)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async insertSession(
    supabase: SupabaseClient,
    sessionData: {
      name: string
      slug: string
      access_code: string | null
      user_id: string
      expires_at: string
      logo_url: string | null
    }
  ) {
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select('id, slug')
      .single()

    if (error) throw error
    return data
  },

  async deleteSession(supabase: SupabaseClient, sessionId: number) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (error) throw error
    return true
  },

  async uploadLogo(supabase: SupabaseClient, file: File, userId: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('sessions-logos')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from('sessions-logos').getPublicUrl(fileName)

    return publicUrl
  }
}
