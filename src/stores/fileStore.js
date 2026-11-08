import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSessionStore } from '@/stores/sessionStore'
import { analytics } from '@/lib/analytics'

// Quotas Option B (Cloudflare R2)
export const FREE_MAX_FILES_PER_SESSION = 1
export const FREE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo (Free)
export const PRO_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 Mo (Pro)

export const useFileStore = defineStore('file', () => {
  const files = ref([])
  const loading = ref(false)
  const uploading = ref(false)
  const errorMsg = ref('')
  let realtimeChannel = null

  // Récupérer les fichiers d'une session depuis Supabase Postgres
  // (Les anciens liens Supabase Storage et les nouveaux liens https://files.qalive.online cohabitent de façon transparente)
  async function fetchFiles(sessionId) {
    loading.value = true
    errorMsg.value = ''
    try {
      const { data, error } = await supabase
        .from('session_files')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      files.value = data || []
    } catch (err) {
      console.error('Error fetching files:', err)
      errorMsg.value = 'Impossible de charger les fichiers.'
    } finally {
      loading.value = false
    }
  }

  // Uploader un fichier vers Cloudflare R2 via l'Edge Function `r2-upload` (Presigned PUT URL)
  // puis enregistrer la métadonnée dans `public.session_files` sur Supabase
  async function uploadFile(file, sessionId) {
    uploading.value = true
    errorMsg.value = ''
    try {
      const sessionStore = useSessionStore()
      const isPremium = Boolean(sessionStore.isPremium)

      // 1. Vérification locale instantanée des quotas Option B (doublée côté serveur dans r2-upload)
      if (!isPremium && files.value.length >= FREE_MAX_FILES_PER_SESSION) {
        analytics.trackEvent('upgrade_modal_opened', { reason: 'free_file_limit_1_reached' })
        sessionStore.showUpgradePlanModal = true
        throw new Error(
          'Free Plan is limited to 1 document per session. Upgrade to Pro for unlimited documents.',
        )
      }

      const maxBytes = isPremium ? PRO_MAX_FILE_SIZE_BYTES : FREE_MAX_FILE_SIZE_BYTES
      if (file.size > maxBytes) {
        const limitLabel = isPremium ? '25 MB' : '5 MB (Free Plan — upgrade to Pro for up to 25 MB)'
        throw new Error(`File is too large. Maximum allowed size is ${limitLabel}.`)
      }

      // 2. Demander une URL signée S3 (Presigned PUT URL) à l'Edge Function Supabase `r2-upload`
      const { data: r2Data, error: fnError } = await supabase.functions.invoke('r2-upload', {
        body: {
          sessionId: Number(sessionId),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
        },
      })

      if (fnError || !r2Data?.ok || !r2Data?.uploadUrl || !r2Data?.publicUrl) {
        const serverError = r2Data?.error || fnError?.message || 'Failed to authorize R2 upload.'
        if (r2Data?.code === 'FREE_FILE_LIMIT_REACHED') {
          sessionStore.showUpgradePlanModal = true
        }
        throw new Error(serverError)
      }

      // 3. Upload binaire direct du navigateur vers Cloudflare R2
      const putResponse = await fetch(r2Data.uploadUrl, {
        method: 'PUT',
        body: file,
      })

      if (!putResponse.ok) {
        throw new Error(`Cloudflare R2 upload failed (HTTP ${putResponse.status}).`)
      }

      // 4. Insérer la métadonnée dans la table Supabase `public.session_files`
      const { data, error: dbError } = await supabase
        .from('session_files')
        .insert([
          {
            session_id: sessionId,
            file_name: file.name,
            file_url: r2Data.publicUrl,
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
          },
        ])
        .select()
        .single()

      if (dbError) throw dbError

      if (data) {
        const exists = files.value.find((f) => f.id === data.id)
        if (!exists) files.value.unshift(data)
      }

      analytics.trackEvent('document_uploaded', {
        session_id: sessionId,
        file_type: file.type,
        storage: 'cloudflare_r2',
      })

      return data
    } catch (err) {
      console.error('Error uploading file:', err)
      errorMsg.value = err.message || "Erreur lors de l'upload du fichier."
      throw err
    } finally {
      uploading.value = false
    }
  }

  // Souscription Realtime Supabase (inchangée : notifie instantanément tous les participants)
  function subscribeToFiles(sessionId) {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel)

    realtimeChannel = supabase
      .channel(`files:session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_files',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const exists = files.value.find((f) => f.id === payload.new.id)
          if (!exists) {
            files.value.unshift(payload.new)
          }
        },
      )
      .subscribe()
  }

  function unsubscribeFromFiles() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  return {
    files,
    loading,
    uploading,
    errorMsg,
    fetchFiles,
    uploadFile,
    subscribeToFiles,
    unsubscribeFromFiles,
  }
})
