<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import AppLayout from "@/layouts/AppLayout.vue";
import QuestionCard from "@/components/basis/questionCard.vue";
import { useQuestionStore } from "@/stores/questionStore";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";

const questionStore = useQuestionStore();
const route = useRoute();
const slug = route.params.slug;

const { questions, currentSession, loading, errorMsg } = storeToRefs(questionStore);
const { fetchQuestions, subscribeToQuestions, unsubscribeFromQuestions } = questionStore;

// États pour le modal
const selectedQuestion = ref(null);
const selectedQuestionIndex = ref(null);
const showQuestionModal = ref(false);

// Ouvre le modal sur la question choisie et sauvegarde son index
function openQuestionModal(question) {
  const idx = questions.value.findIndex((q) => q.id === question.id);
  selectedQuestionIndex.value = idx;
  selectedQuestion.value = question;
  showQuestionModal.value = true;
}

// Change la question affichée selon l'index sans dépasser les limites
function showQuestionByIndex(index) {
  if (index >= 0 && index < questions.value.length) {
    selectedQuestionIndex.value = index;
    selectedQuestion.value = questions.value[index];
  }
}

// Handler flèches clavier pour navigation
function handleArrowKey(e) {
  if (!showQuestionModal.value) return;
  if (e.key === "ArrowLeft") {
    showQuestionByIndex(selectedQuestionIndex.value - 1);
  } else if (e.key === "ArrowRight") {
    showQuestionByIndex(selectedQuestionIndex.value + 1);
  }
}

// Initialisation avec temps réel
onMounted(async () => {
  window.addEventListener("keydown", handleArrowKey);

  await fetchQuestions(slug);

  if (currentSession.value?.id) {
    subscribeToQuestions(currentSession.value.id);
  }
});

// Nettoyage à la destruction du composant
onUnmounted(() => {
  window.removeEventListener("keydown", handleArrowKey);
  unsubscribeFromQuestions();
});


import { useFileStore } from "@/stores/fileStore";
import FileUpload from "@/components/files/FileUpload.vue";
import FileList from "@/components/files/FileList.vue";

const fileStore = useFileStore();
const showFileSection = ref(false);

import { watch } from 'vue';
watch(currentSession, (newVal) => {
    if (newVal?.id) {
        fileStore.fetchFiles(newVal.id);
    }
}, { immediate: true });

</script>

<template>
  <AppLayout>
    <div class="mt-[28px] space-y-6">
      <div class="mb-[35px] space-y-[10px]" v-if="currentSession">
        <div class="flex items-end space-x-2">
          <h1 class="text-base md:text-lg font-medium text-primary leading-[100%]">
            Session : <span class="font-semibold">{{ currentSession.name }}</span>
          </h1>
          <a
            :href="`/session/${slug}/qrcode`"
            class="underline text-[13px] leading-[100%]"
            ><svg
              class="group"
              width="18"
              height="18"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12.0047"
                cy="12.005"
                r="9.00375"
                stroke="#161924"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M10.0039 12.005H14.0056"
                stroke="#161924"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M13.5059 9.00378H14.0061C15.6636 9.00378 17.0073 10.3475 17.0073 12.005V12.005C17.0073 13.6626 15.6636 15.0063 14.0061 15.0063H13.5059"
                stroke="#161924"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M10.5044 15.0063H10.0042C8.34664 15.0063 7.00293 13.6626 7.00293 12.005V12.005C7.00293 10.3475 8.34664 9.00378 10.0042 9.00378H10.5044"
                stroke="#161924"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg
          ></a>
        </div>

        <p class="text-sm text-[#777]">
          All the questions of attenders during this presention are displayed here.
        </p>
      </div>

      <!-- Section Documents (Organisateur) -->
      <div v-if="currentSession" class="bg-gray-50/50 rounded-lg p-1">
        <button
            @click="showFileSection = !showFileSection"
            class="flex items-center justify-between space-x-2 text-sm font-medium text-gray-700 px-3 py-2 w-full hover:bg-gray-100 rounded-md transition-colors"
        >
          <div class="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.5186 13.633H8.54714C8.21609 13.633 7.90649 13.4692 7.72029 13.1954L7.2048 12.4376C7.01861 12.1638 6.70901 12 6.37795 12H4.51855C3.69013 12 3.01855 12.6716 3.01855 13.5V19.5C3.01855 20.3284 3.69013 21 4.51855 21H11.5186C12.347 21 13.0186 20.3284 13.0186 19.5V15.133C13.0186 14.3046 12.347 13.633 11.5186 13.633Z" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 21H17.5C18.8807 21 20 19.8807 20 18.5V8.37167C20 7.57602 19.6839 6.81296 19.1213 6.25035L16.7497 3.87868C16.187 3.31607 15.424 3 14.6283 3H7.5C6.11929 3 5 4.11929 5 5.5V9" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.9764 8H16.5C15.6716 8 15 7.32843 15 6.5V3.02362" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
            <span>Shared Documents ({{ fileStore.files.length }})</span>
          </div>
            <span class="material-symbols-outlined text-[18px] ml-auto transition-transform" :class="{'rotate-180': showFileSection}">expand_more</span>
        </button>

        <div v-show="showFileSection" class="p-3 space-y-4 border-t border-gray-100 mt-1">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Add a document</h4>
                    <FileUpload :session-id="currentSession.id" />
                </div>
                <div>
                    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Available documents</h4>
                    <FileList />
                </div>
            </div>
        </div>
      </div>


      <div v-if="loading" class="text-center text-gray-500 text-sm">Loading...</div>
      <div
        v-else-if="errorMsg"
        class="text-center text-red-500 bg-red-100 p-4 rounded-md"
      >
        {{ errorMsg }}
      </div>

      <div
        v-else-if="questions.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <QuestionCard
          v-for="question in questions"
          :key="question.id"
          :question="question"
          @click="openQuestionModal(question)"
        />
      </div>

      <div v-else class="text-center pt-[70px] flex flex-col items-center space-y-4">
        <img src="/illustrations/empty1.svg" alt="" class="max-w-[80%] md:max-w-full" />
        <p class="text-gray-700 text-[13px]">The are no questions yet.</p>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showQuestionModal"
          @click.self="showQuestionModal = false"
          class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <div
            class="bg-white rounded-md px-4 py-6 md:px-8 md:py-10 max-w-[1025px] w-full shadow-2xl relative"
          >
            <img
              src="/images/santa.svg"
              alt="Chapeau de Noël"
              class="absolute rotate-[-20deg] -top-7 md:-top-10 -left-10 md:-left-14 w-20 md:w-28 pointer-events-none"
            />
            <button
              @click="showQuestionModal = false"
              class="absolute top-2 right-4 md:right-6 text-3xl font-light text-gray-400 hover:text-gray-800 transition-colors"
            >
              &times;
            </button>

            <div v-if="selectedQuestion">
              <h6 class="text-sm mb-2 text-gray-600">Question :</h6>
              <p class="text-xl md:text-2xl font-light mb-4 leading-[150%]">
                {{ selectedQuestion.content }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<style>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
