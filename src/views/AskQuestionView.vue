<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layouts/AppLayout.vue'

const route = useRoute()
const sessionSlug = route.params.slug

const questionText = ref('')
const authorName = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const sessionExpired = ref(false)
const loadingPage = ref(true)

const submitQuestion = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true

  if (sessionExpired.value) {
    errorMsg.value = 'Impossible de soumettre, la session est terminée.'
    return
  }
  if (!questionText.value.trim()) {
    errorMsg.value = 'Merci de saisir votre question'
    loading.value = false
    return
  }

  const { error } = await supabase.from('questions').insert([
    {
      content: questionText.value,
      author_name: authorName.value || null,
      session_slug: sessionSlug,
    },
  ])

  loading.value = false

  if (error) {
    errorMsg.value = error.message
  } else {
    successMsg.value = 'Your question was sent successfuly !' // Le message est défini
    questionText.value = ''
    authorName.value = ''

    // 2. On lance un minuteur pour effacer le message après 3 secondes
    setTimeout(() => {
      successMsg.value = ''
    }, 3000) // 3000 millisecondes = 3 secondes
  }
  loading.value = false // Assurez-vous que loading est remis à false ici aussi
}

onMounted(async () => {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('expires_at')
    .eq('id', sessionSlug)
    .single()

  if (error || !session) {
    errorMsg.value = "This session don't exist."
    sessionExpired.value = true
  } else if (session.expires_at && new Date(session.expires_at) < new Date()) {
    errorMsg.value = 'This questions session is over'
    sessionExpired.value = true
  }

  loadingPage.value = false
})
</script>

<template>
  <AppLayout>
    <div class="h-screen sm:flex sm:items-center sm:justify-center max-sm:mt-[80px]">
      <div class="space-y-4 max-sm:w-full">
        <Teleport to="body">
          <!-- On enveloppe le message dans un composant Transition -->
          <Transition name="push-notification">
            <div
              v-if="successMsg"
              class="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-green-100 text-green-800 border border-green-600 px-6 py-3 rounded-[6px] flex items-center space-x-3 w-max"
            >
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
              <span class="text-[13px] font-medium w-full">{{ successMsg }}</span>
            </div>
          </Transition>
        </Teleport>
        <div v-if="loadingPage" class="text-center text-sm text-gray-500">
          Session verification ...
        </div>
        <div
          v-else-if="sessionExpired"
          class="text-center flex items-center justify-center flex-col"
        >
          <h1 class="text-[20px] font-semibold mb-8 text-red-500">Session ended</h1>
          <div class="flex flex-col items-center space-y-3">
            <svg
              class="oc-time-flies"
              width="100"
              height="50"
              viewBox="0 0 212 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M46.0605 133.709C28.6189 119.724 70.3254 112.613 93.3528 111.11C93.8201 111.079 94.2328 111.387 94.3684 111.835C101.29 134.713 118.865 143.998 126.92 146.225C107.649 148.145 63.7026 147.854 46.0605 133.709Z"
                fill="black"
              />
              <circle cx="144.404" cy="96.7561" r="46.2839" stroke="black" stroke-width="2" />
              <path
                d="M144.404 44.5117C173.258 44.5118 196.648 67.9023 196.648 96.7559C196.648 125.609 173.258 149 144.404 149C115.551 149 92.1602 125.609 92.1602 96.7559C92.1602 67.9023 115.551 44.5117 144.404 44.5117Z"
                stroke="black"
                stroke-width="2"
              />
              <ellipse cx="144.404" cy="57.8167" rx="2.38406" ry="2.38406" fill="black" />
              <ellipse cx="144.404" cy="135.695" rx="2.38406" ry="2.38406" fill="black" />
              <ellipse cx="183.344" cy="96.7552" rx="2.38406" ry="2.38406" fill="black" />
              <ellipse cx="105.464" cy="96.7552" rx="2.38406" ry="2.38406" fill="black" />
              <path
                d="M144.403 92.1924C147.143 92.1924 149.363 94.413 149.363 97.1523C149.363 99.8918 147.143 102.112 144.403 102.112C141.664 102.112 139.443 99.8917 139.443 97.1523C139.443 94.4131 141.664 92.1925 144.403 92.1924Z"
                stroke="black"
                stroke-width="2"
              />
              <path
                d="M124.537 97.1528H139.636"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M59.7693 59.6049C57.9812 59.34 53.968 58.5718 52.2197 57.6182"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M101.69 65.962C96.3255 66.4255 84.2462 66.5977 74.0742 62.7832"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M91.557 93.7759C77.8486 94.107 48.7233 93.4183 36.3262 88.8091"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M57.3856 107.881C43.5448 107.418 12.8036 105.497 0.56543 101.524"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M144.404 92.5841V66.5581"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M193.675 80.465C199.834 80.8623 212.549 84.2399 211.357 76.4916C210.773 72.6958 206.903 71.8502 204.583 71.8916C204.225 71.898 203.883 71.7414 203.665 71.4569C200.974 67.9428 194.625 62.9737 188.085 68.1445"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M119.57 27.3169C121.16 20.8269 128.908 9.794 147.186 17.5819L152.947 20.4661"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M147.186 17.5814C151.093 14.9324 160.695 12.0981 165.463 21.9522"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M111.425 27.9126H126.127"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M63.359 11.1423C62.813 7.74431 59.4919 5.09702 55.3974 5.09702C54.624 5.09702 53.8506 5.21555 53.1682 5.3736C51.0754 2.17315 47.1174 0 42.568 0C35.8348 0 30.4209 4.74141 30.4209 10.5496"
                stroke="black"
                stroke-width="2"
                stroke-miterlimit="10"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M63.3591 11.1422C68.227 11.6558 72.0031 15.2514 72.0031 19.6372C72.0031 24.3786 67.5901 28.2113 62.1307 28.2113L35.3344 28.1718H32.6047C27.1454 28.1718 22.7324 24.3391 22.7324 19.5977C22.7324 15.4885 26.0535 12.0905 30.4665 11.2212C32.4683 10.8129 37.691 10.0517 42.5681 10.2729M63.3591 11.2212C61.8729 10.971 57.9452 11.1817 54.1237 14.0266"
                stroke="black"
                stroke-width="2"
                stroke-miterlimit="10"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p v-if="errorMsg" class="text-gray-700 text-center text-sm">{{ errorMsg }}</p>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div>
            <h1 class="text-xxl font-semibold mb-2">Ask your questions</h1>
            <p class="text-sm text-gray-600">
              You can all the questions you want during the persentation
            </p>
          </div>

          <form @submit.prevent="submitQuestion" class="space-y-6">
            <div class="space-y-2">
              <div>
                <textarea
                  v-model="questionText"
                  rows="4"
                  class="w-full py-2 px-3 border rounded outline-none text-sm resize-none"
                  placeholder="Enter your question here..."
                  required
                  :disabled="loading"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm mb-[6px] text-gray-500">Your name (optional) :</label>
                <input v-model="authorName" class="w-full p-2 border rounded" :disabled="loading" />
              </div>
            </div>

            <button
              type="submit"
              class="w-full py-3 px-4 bg-[#7738C7] text-white rounded-[4px] text-sm"
              :disabled="loading"
            >
              {{ loading ? 'Envoi...' : 'Envoyer ma question' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style>
/* Animation d'entrée : la notification descend */
.push-notification-enter-active {
  animation: slide-down 0.5s ease-out;
}

/* Animation de sortie : la notification part vers la droite et disparaît */
.push-notification-leave-active {
  animation: slide-right-fade 0.7s ease-in;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translate(-50%, -100px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes slide-right-fade {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(
      100px,
      0
    ); /* La notification se déplace de 100px vers la droite en disparaissant */
  }
}
</style>
