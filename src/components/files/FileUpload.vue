<script setup>
import { ref } from 'vue'
import { useFileStore } from '@/stores/fileStore'

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
})

const fileStore = useFileStore()
const fileInput = ref(null)

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    await fileStore.uploadFile(file, props.sessionId)
    // Reset input
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    // Error logic is handled in store (setting errorMsg)
  }
}
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
    <h3 class="font-semibold text-gray-800 mb-3 text-sm">Share a document</h3>
    
    <div v-if="fileStore.errorMsg" class="text-red-500 text-xs mb-2">
      {{ fileStore.errorMsg }}
    </div>

    <div class="flex items-center space-x-3">
      <label 
        class="cursor-pointer bg-gray-50 space-x-[6px] hover:bg-gray-100 text-gray-700 text-xs py-2 px-3 rounded border border-gray-200 flex items-center transition-colors"
        :class="{'opacity-50 cursor-not-allowed': fileStore.uploading}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 8H15C14.448 8 14 7.552 14 7V3" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 17V19C5 20.105 5.895 21 7 21H17C18.105 21 19 20.105 19 19V7.828C19 7.298 18.789 6.789 18.414 6.414L15.586 3.586C15.211 3.211 14.702 3 14.172 3H7C5.895 3 5 3.895 5 5V11" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.08973 12.03L10.9997 13.94L8.96973 15.97" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M11 13.94H5" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span v-if="fileStore.uploading">Uploading...</span>
        <span v-else>Choose a file</span>
        
        <input 
          ref="fileInput"
          type="file" 
          class="hidden" 
          @change="handleFileChange"
          :disabled="fileStore.uploading"
        >
      </label>
      
      <span v-if="!fileStore.uploading" class="text-xs text-gray-400">
        PDF, Images, etc.
      </span>
    </div>
  </div>
</template>
