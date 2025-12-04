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

  // 1. Charger les questions initiales
  await fetchQuestions(slug);

  // 2. S'abonner aux nouvelles questions si la session est chargée
  if (currentSession.value?.id) {
    subscribeToQuestions(currentSession.value.id);
  }
});

// Nettoyage à la destruction du composant
onUnmounted(() => {
  window.removeEventListener("keydown", handleArrowKey);
  unsubscribeFromQuestions();
});
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
