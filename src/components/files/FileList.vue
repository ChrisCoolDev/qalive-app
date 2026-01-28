<script setup>
import { computed } from 'vue'
import { useFileStore } from '@/stores/fileStore'
import { storeToRefs } from 'pinia'

// Props par défaut : pas besoin de passer sessionId si utilisé via le store déjà initialisé,
// mais utile si le composant est autonome. Ici on utilise le store.
const fileStore = useFileStore()
const { files, loading } = storeToRefs(fileStore)

const hasFiles = computed(() => files.value && files.value.length > 0)

function getIcon(type) {
  if (type.includes('image')) return 'image'
  if (type.includes('pdf')) return 'picture_as_pdf'
  return 'description'
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="loading && !hasFiles" class="text-center text-xs text-gray-400 py-2">
      Loading documents...
    </div>

    <div v-else-if="hasFiles" class="grid grid-cols-1 gap-2">
      <div 
        v-for="file in files" 
        :key="file.id"
        class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group"
      >
        <div class="flex items-center space-x-3 overflow-hidden">
          <div class="w-8 h-8 rounded bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
            <span class="material-symbols-outlined text-[18px]">{{ getIcon(file.file_type) }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">{{ file.file_name }}</p>
            <p class="text-[11px] text-gray-400">{{ formatSize(file.file_size) }}</p>
          </div>
        </div>

        <a 
          :href="file.file_url" 
          target="_blank"
          download
          class="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-50 rounded-full"
          title="Download"
        >
          <span class="material-symbols-outlined text-[20px]">download</span>
        </a>
      </div>
    </div>

    <div v-else class="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
      <span class="material-symbols-outlined text-gray-300 text-3xl mb-1">folder_open</span>
      <p class="text-xs text-gray-500">No shared documents yet.</p>
    </div>
  </div>
</template>
