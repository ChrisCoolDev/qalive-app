import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useFileStore = defineStore('file', () => {
    const files = ref([])
    const loading = ref(false)
    const uploading = ref(false)
    const errorMsg = ref('')
    let realtimeChannel = null

    // Récupérer les fichiers d'une session
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
            files.value = data
        } catch (err) {
            console.error('Error fetching files:', err)
            errorMsg.value = "Impossible de charger les fichiers."
        } finally {
            loading.value = false
        }
    }

    // Uploader un fichier
    async function uploadFile(file, sessionId) {
        uploading.value = true
        errorMsg.value = ''
        try {
            // 1. Upload vers Storage
            // Nom unique : timestamp_nom_fichier
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = `${sessionId}/${fileName}`

            const { error: storageError } = await supabase.storage
                .from('session-files')
                .upload(filePath, file)

            if (storageError) throw storageError

            // 2. Récupérer l'URL publique
            const { data: publicUrlData } = supabase.storage
                .from('session-files')
                .getPublicUrl(filePath)

            // 3. Insérer la métadonnée en base
            const { data, error: dbError } = await supabase
                .from('session_files')
                .insert([
                    {
                        session_id: sessionId,
                        file_name: file.name,
                        file_url: publicUrlData.publicUrl,
                        file_size: file.size,
                        file_type: file.type
                    }
                ])
                .select()
                .single()

            if (dbError) throw dbError

            // Note: Pas besoin d'ajouter manuellement à la liste si le Realtime est activé,
            // mais on le fait pour l'UX immédiate si le realtime tarde.
            // S'il y a doublon, l'ID unique de Vue (key) gérera ou on peut vérifier l'existence.
            if (data) {
                // On vérifie si le fichier n'est pas déjà arrivé via realtime
                const exists = files.value.find(f => f.id === data.id)
                if (!exists) files.value.unshift(data)
            }

            return data
        } catch (err) {
            console.error('Error uploading file:', err)
            errorMsg.value = "Erreur lors de l'upload du fichier."
            throw err
        } finally {
            uploading.value = false
        }
    }

    // Souscription Realtime
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
                    // Ajouter le nouveau fichier en tête de liste
                    // Vérifier les doublons
                    const exists = files.value.find(f => f.id === payload.new.id)
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
        unsubscribeFromFiles
    }
})
