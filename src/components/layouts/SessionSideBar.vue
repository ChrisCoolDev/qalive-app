<script setup lang="ts">
import { ref, watch } from 'vue';
import QuestionCard from '../features/QuestionCard.vue';
import ShareSessionModal from '../features/ShareSessionModal.vue';
import SharedFilePopover from './SessionSideBar/SharedFilePopover.vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useQuestionStore } from '@/stores/questionStore';

const sessionStore = useSessionStore();
const questionStore = useQuestionStore();

const showShareModal = ref(false);

watch(
  () => sessionStore.selectedSession,
  (newSession) => {
    if (newSession && newSession.slug) {
      questionStore.fetchQuestions(newSession.slug);
      questionStore.subscribeToQuestions(newSession.id);
    } else {
      questionStore.unsubscribeFromQuestions();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="sessionStore.isSidebarOpen" class="py-6 px-4 h-full w-[324px] min-w-[324px] max-w-[324px] bg-white z-40 border-l border-l-[#E8E8E8] absolute top-0 right-0 space-y-3">
    <div class="flex items-center justify-between w-full">
      <h2 class="text-[16px] font-semibold text-balck truncate mr-2">{{ sessionStore.selectedSession?.name }}</h2>
      <svg @click="sessionStore.closeSidebar()" class="frame cursor-pointer flex-shrink-0 hover:bg-gray-100 rounded-full p-1" width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L4 12M4 4L12 12" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <div class="flex items-center space-x-[10px]">
      <SharedFilePopover />
      <button
        id="open-share-session"
        type="button"
        @click="showShareModal = true"
        class="flex items-center justify-center bg-[#D4382A] text-white px-2 py-[6px] rounded-[6px] text-[14px] cursor-pointer"
      >Share</button>
    </div>
    <div class="space-y-[10px] overflow-y-auto h-[calc(100vh-140px)] pb-6 scrollbar-hide">
      <p v-if="questionStore.loading" class="text-[13px] text-gray-500 text-center py-4">Chargement...</p>
      <p v-else-if="questionStore.questions.length === 0" class="text-[13px] text-gray-500 text-center py-4">Aucune question.</p>
      <QuestionCard 
        v-else
        v-for="question in questionStore.questions" 
        :key="question.id" 
        :question="question" 
      />
    </div>
  </div>

  <!-- Share the session modal -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="showShareModal && sessionStore.selectedSession"
        @click.self="showShareModal = false"
        class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      >
        <ShareSessionModal :session="sessionStore.selectedSession" @close="showShareModal = false" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
