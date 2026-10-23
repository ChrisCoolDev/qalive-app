<script setup lang="ts">
import { ref, watch } from 'vue';
import ParticipantQuestionItem from './SessionSideBar/ParticipantQuestionItem.vue';
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

const handleUpvote = (questionId: number) => {
  questionStore.upvoteQuestion(questionId);
};
</script>

<template>
  <div
    v-if="sessionStore.isSidebarOpen"
    class="pt-[23px] px-4 pb-6 h-full w-[324px] min-w-[324px] max-w-[324px] bg-white z-40 border-l border-[#E8E8E8] absolute top-0 right-0 flex flex-col select-none"
  >
    <!-- Header (Frame 31) -->
    <div class="flex items-center justify-between w-full h-[19px]">
      <h2 class="font-['Inter'] font-semibold text-[16px] text-black leading-normal truncate mr-2">
        {{ sessionStore.selectedSession?.name }}
      </h2>
      <button
        type="button"
        @click="sessionStore.closeSidebar()"
        class="shrink-0 p-0 text-[#666666] hover:text-black transition-colors cursor-pointer"
        aria-label="Fermer"
      >
        <svg
          class="shrink-0 size-[16px]"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Actions Row (Group 14) -->
    <div class="mt-[15px] flex items-center gap-[10px] w-full">
      <SharedFilePopover />
      <button
        id="open-share-session"
        type="button"
        @click="showShareModal = true"
        class="w-[55px] h-[31px] bg-[#D4382A] hover:bg-[#b82f23] text-white rounded-[6px] font-['Inter'] font-normal text-[14px] flex items-center justify-center transition-colors cursor-pointer shrink-0"
      >
        Share
      </button>
    </div>

    <!-- Activity Section (Frame 32) -->
    <div class="mt-[15px] flex-1 flex flex-col min-h-0">
      <!-- Section Title: Activity <count> -->
      <p class="font-['Inter'] font-medium text-[14px] text-[#212121] leading-normal">
        Activity <span class="text-[#6E686A]">{{ questionStore.questions.length }}</span>
      </p>

      <!-- Questions List (Frame 29) -->
      <div class="mt-[18px] flex-1 overflow-y-auto space-y-[10px] pr-0.5 scrollbar-hide">
        <p v-if="questionStore.loading" class="text-[13px] text-gray-400 text-center py-6">
          Loading...
        </p>
        <p v-else-if="questionStore.questions.length === 0" class="text-[13px] text-gray-400 text-center py-6">
          No questions yet.
        </p>
        <ParticipantQuestionItem
          v-else
          v-for="question in questionStore.questions"
          :key="question.id"
          :question="question"
          @upvote="handleUpvote"
        />
      </div>
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
