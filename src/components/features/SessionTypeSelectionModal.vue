<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', type: 'qna' | 'survey' | 'poll'): void
}>()

const selectedType = ref<'qna' | 'survey' | 'poll' | null>(null)

const handleContinue = () => {
  if (selectedType.value) {
    emit('select', selectedType.value)
    selectedType.value = null // reset for next time
  }
}

const closeModal = () => {
  emit('close')
  selectedType.value = null
}
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-xl w-full max-w-xl p-8 shadow-2xl relative" @click.stop>
        <!-- Close button -->
        <button @click="closeModal" class="absolute top-5 right-7 text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-5 h-5" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="#0D0D0D" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 6 6 18M6 6l12 12"/></svg>

        </button>

        <!-- Header -->
        <div class="text-center mb-10 mt-4">
          <h2 class="text-xl font-bold text-gray-800 mb-2">Choose of session that fits your needs.</h2>
        </div>

        <!-- Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">

          <!-- Q&A Card -->
          <div
            @click="selectedType = 'qna'"
            class="relative flex flex-col items-center px-4 py-8 border rounded-lg cursor-pointer transition-all duration-200"
            :class="selectedType === 'qna' ? 'border-[#2883DE] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
          >
            <!-- Radio check -->
            <div class="absolute top-4 right-4">
              <svg class="w-4 h-4" v-if="selectedType=== 'qna'" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="#2883DE" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m7.5 12 3 3 6-6m5.5 3c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10"/></svg>
              <svg v-else class="w-4 h-4" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="#E6E7EB" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10"/></svg>
            </div>

            <!-- Illustration (Icon for now) -->
            <img class="w-[120px] h-[120px]" src="/public/illustrations/qa.svg" alt="poll illustration">
            <h3 class="font-semibold text-gray-800 text-[14px] mb-1">Q&A</h3>
            <p class="text-sm text-gray-500 text-center">Interactive question and answer session.</p>
          </div>

          <!-- Survey Card -->
          <div
            @click="selectedType = 'survey'"
            class="relative flex flex-col items-center px-4 py-8 border rounded-lg cursor-pointer transition-all duration-200"
            :class="selectedType === 'survey' ? 'border-[#2883DE] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
          >
            <!-- Radio check -->
            <div class="absolute top-4 right-4">
              <svg class="w-4 h-4" v-if="selectedType=== 'survey'" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="#2883DE" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m7.5 12 3 3 6-6m5.5 3c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10"/></svg>
              <svg v-else class="w-4 h-4" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="#E6E7EB" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10"/></svg>
            </div>

            <!-- Illustration (Icon for now) -->
            <img class="w-[120px] h-[120px]" src="/public/illustrations/poll.svg" alt="poll illustration">
            <h3 class="font-semibold text-gray-800 text-lg mb-1">Survey</h3>
            <p class="text-xs text-gray-500 text-center">Collect feedback and detailed answers.</p>
          </div>

          <!-- Poll Card -->
          <div
            @click="selectedType = 'poll'"
            class="relative flex flex-col items-center px-4 py-8 border rounded-lg cursor-pointer transition-all duration-200"
            :class="selectedType === 'poll' ? 'border-[#2883DE] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
          >
            <!-- Radio check -->
            <div class="absolute top-4 right-4">
              <svg class="w-4 h-4" v-if="selectedType=== 'poll'" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="#2883DE" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m7.5 12 3 3 6-6m5.5 3c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10"/></svg>
              <svg v-else class="w-4 h-4" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="#E6E7EB" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10"/></svg>
            </div>

            <!-- Illustration (Icon for now) -->
            <img class="w-[120px] h-[120px]" src="/public/illustrations/poll.svg" alt="poll illustration">
            <h3 class="font-semibold text-gray-800 text-lg mb-1">Poll</h3>
            <p class="text-xs text-gray-500 text-center">Quick votes and instant results.</p>
          </div>

        </div>

        <!-- Action Button -->
        <div class="flex justify-center">
          <button
            @click="handleContinue"
            :disabled="!selectedType"
            class="px-4 py-2 text-[13px] rounded-md font-medium text-white transition-colors"
            :class="selectedType ? 'bg-[#2883DE] hover:bg-[#2072c4]' : 'bg-gray-300 cursor-not-allowed'"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
