<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'
import { supabase } from '@/lib/supabase'
import CreateSessionModal from '@/components/basis/CreateSessionModal.vue'
import DashboardCard from '@/components/basis/dashboardCard.vue'
import { formatTimeLocal, formatDateLocal } from '@/utils/dateHelper'
import { exposeDashboardaInformations } from '@/datas/dashboardDatas'
import UpgradePlanModal from '@/components/basis/UpgradePlanModal.vue'

const logoVariants = [
  '/logos/logo-variants/logo_variant_1.png',
  '/logos/logo-variants/logo_variant_2.png',
  '/logos/logo-variants/logo_variant_3.png',
]

const getRandomVariant = (sessionId) => {
  if (!sessionId) return logoVariants[0]

  // On transforme l'ID (ex: "a1b2...") en un nombre unique
  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash += sessionId.charCodeAt(i)
  }

  // Le modulo (%) permet de toujours tomber sur un index valide (0, 1 ou 2)
  const index = hash % logoVariants.length

  return logoVariants[index]
}

const sessionStore = useSessionStore()

const {
  sessions,
  totalSessions,
  totalQuestions,
  activeSessions,
  page,
  loading,
  errorMsg,
  showModal,
  showUpgradePlanModal,
  totalPages,
  user,
  isPremium, // Nouveau
} = storeToRefs(sessionStore)

const { fetchDashboardData, nextPage, prevPage, deleteSession } = sessionStore

// ... (Code de recherche inchangé) ...
const searchQuery = ref('')
const allSessions = ref([])
const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) return sessions.value
  const query = searchQuery.value.toLowerCase().trim()
  return allSessions.value.filter((session) => session.name.toLowerCase().includes(query))
})
const showNoResults = computed(
  () => searchQuery.value.trim() && filteredSessions.value.length === 0,
)
const showTable = computed(() => totalSessions.value > 0 && !showNoResults.value)

function openModal() {
  showModal.value = true
}

// ... (loadAllSessions inchangé) ...
async function loadAllSessions() {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, questions(id)')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    allSessions.value = data.map((session) => ({
      ...session,
      questionCount: session.questions?.length || 0,
    }))
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  // --- DÉBUT DU NETTOYAGE D'URL ---
  // On vérifie s'il y a des paramètres de retour de paiement
  const url = new URL(window.location.href)
  if (url.searchParams.has('checkout') || url.searchParams.has('order_id')) {
    // On nettoie l'URL visuellement sans recharger la page
    window.history.replaceState({}, document.title, window.location.pathname)

    // Optionnel : Tu peux afficher un petit toast "Paiement réussi !" ici
    console.log('Paiement Lemon Squeezy détecté et URL nettoyée.')
  }
  // --- FIN DU NETTOYAGE ---

  await fetchDashboardData()
  await loadAllSessions()
  timer = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

// ... (Helpers dates inchangés) ...
const now = ref(new Date())
let timer
function localHourEnsured(dateString) {
  if (!dateString) return new Date(0)
  if (typeof dateString === 'string' && !dateString.endsWith('Z')) {
    dateString = dateString.replace(' ', 'T') + 'Z'
  }
  return new Date(dateString)
}
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const redirectToQuestionsView = (slug) => (window.location.href = `/session/${slug}`)
const redirectToUserProfilePage = () => (window.location.href = '/profile')
const dashboardInformations = computed(() =>
  exposeDashboardaInformations(totalSessions, totalQuestions, activeSessions),
)
</script>

<template>
  <AppLayout>
    <div class="mt-[28px] md:px-0">
      <div class="mb-[35px] flex items-center justify-between" v-if="user && user.user_metadata">
        <div class="space-y-1">
          <h1 class="text-lg font-medium text-primary flex items-center gap-2">
            🌤️ Hi {{ user.user_metadata.name.split(' ')[0] }},
            <span
              v-if="isPremium"
              class="px-2 py-0.5 bg-[#E85D4A] text-white text-[10px] rounded-full tracking-wider"
              >Pro</span
            >
            <span
              v-else
              class="px-2 py-0.5 bg-[#F6F5EF] text-gray-600 text-[10px] rounded-full tracking-wider"
              >Free</span
            >
          </h1>
          <p class="text-[14px] text-[#777] font-mabry">Track your audience engagement.</p>
        </div>
        <div class="cursor-pointer" @click="redirectToUserProfilePage">
          <img
            :src="user.user_metadata.picture"
            class="w-9 h-9 rounded-[4px] border border-[#E85D4A] ml-2"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-y-0 md:gap-x-[12px] mb-[45px]">
        <DashboardCard
          v-for="(info, index) in dashboardInformations"
          :key="index"
          :dashboardInformation="info"
        />
      </div>

      <div
        class="flex flex-col md:flex-row justify-between mb-6 items-start md:items-center space-y-4 md:space-y-0"
      >
        <div
          class="py-[6px] px-2 w-full md:w-max border border-[#E6E6E6] bg-gray-50 flex space-x-2 items-center rounded-[4px]"
        >
          <span class="material-symbols-outlined text-gray-400 text-[18px]">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search sessions..."
            class="bg-transparent outline-none text-[13px] w-full md:w-[200px]"
          />
        </div>

        <button
          @click="openModal"
          class="text-center px-[12px] font-medium py-[8px] text-[12px] text-white bg-[#E85D4A] rounded-[4px] w-full md:w-auto shadow-sm hover:bg-[#d44d3c] transition-colors"
        >
          New session
        </button>
      </div>

      <div v-if="loading && sessions.length === 0" class="text-center text-gray-500 py-10 text-sm">
        Loading...
      </div>
      <div v-else-if="errorMsg" class="text-center text-red-500 bg-red-100 p-4 rounded-md">
        {{ errorMsg }}
      </div>

      <div
        v-else-if="totalSessions === 0"
        class="text-center flex flex-col items-center space-y-4 text-gray-500 pt-[70px]"
      >
        <img src="/illustrations/empty2.svg" alt="" class="max-w-[80%] md:max-w-full" />
        <p class="text-[13px]">You didn't create an event yet</p>
      </div>

      <div v-else-if="showTable">
        <div class="overflow-x-auto rounded-[4px] border border-[#E6E6E6]">
          <table class="w-full divide-y divide-[#E6E6E6] text-left min-w-[400px]">
            <thead class="text-[12px] text-gray-600 bg-[#F6F5EF]">
              <tr>
                <th class="py-3 px-3 font-medium">Brand</th>
                <th class="py-3 px-6 font-medium w-max">Event name</th>
                <th class="py-3 px-6 font-medium">Questions</th>
                <th class="py-3 px-6 font-medium">Creation</th>
                <th class="py-3 px-6 font-medium">Expiration</th>
                <th class="py-3 px-6 font-medium">Status</th>
                <th class="py-3 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E6E6E6]">
              <tr
                v-for="session in filteredSessions"
                :key="session.id"
                class="hover:bg-gray-50 cursor-pointer"
                @click="redirectToQuestionsView(session.slug)"
              >
                <td class="py-3 pl-3 text-sm font-medium max:sm:pr-2">
                  <div
                    class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center"
                  >
                    <img
                      v-if="session.logo_url"
                      :src="session.logo_url"
                      alt="Logo"
                      class="w-full h-full object-cover"
                    />

                    <img
                      v-else
                      :src="getRandomVariant(session.id)"
                      alt="Variant Logo"
                      class="w-full h-full object-cover opacity-80"
                    />
                  </div>
                </td>
                <td class="py-3 px-6 text-sm font-medium">
                  <div class="flex items-center space-x-3">
                    <span class="truncate max-w-[180px]" :title="session.name">{{
                      session.name
                    }}</span>
                  </div>
                </td>

                <td class="py-3 px-6 text-xs">{{ session.questionCount || 0 }}</td>

                <td class="py-3 px-6 text-xs -space-y-3">
                  <p>{{ formatDateLocal(session.created_at) }}</p>
                  <br />
                  <p class="text-xs text-gray-400">
                    {{ formatTimeLocal(session.created_at) }}
                  </p>
                </td>

                <td class="py-3 px-6 text-xs -space-y-3">
                  <p>
                    {{ session.expires_at ? formatDateLocal(session.expires_at) : '-' }}
                  </p>
                  <br />
                  <p class="text-xs text-gray-400">
                    {{ session.expires_at ? formatTimeLocal(session.expires_at) : '-' }}
                  </p>
                </td>

                <td class="py-3 px-6">
                  <div
                    :class="[
                      now < localHourEnsured(session.expires_at)
                        ? 'bg-[#D9F3DD] text-[#2F8132]'
                        : 'bg-gray-100 text-gray-600',
                      'px-2 py-1 rounded-[4px] w-max text-[11px] font-medium',
                    ]"
                  >
                    {{ now < localHourEnsured(session.expires_at) ? 'active' : 'inactive' }}
                  </div>
                </td>

                <td class="py-3 px-6 text-right">
                  <button
                    v-if="isPremium"
                    @click.stop="deleteSession(session.id)"
                    class="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Delete session"
                  >
                    <svg
                      class="group"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M16.1379 21H7.85794C6.81094 21 5.94094 20.192 5.86294 19.147L4.96594 7H18.9999L18.1329 19.142C18.0579 20.189 17.1869 21 16.1379 21V21Z"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M12 11V17"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M4 7H20"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M17 7L15.987 4.298C15.694 3.517 14.948 3 14.114 3H9.886C9.052 3 8.306 3.517 8.013 4.298L7 7"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M15.43 11L15 17"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M8.57003 11L9.00003 17"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <div v-else class="group relative inline-block">
                    <svg
                      class="group cursor-not-allowed text-[#161924]"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M16.1379 21H7.85794C6.81094 21 5.94094 20.192 5.86294 19.147L4.96594 7H18.9999L18.1329 19.142C18.0579 20.189 17.1869 21 16.1379 21V21Z"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M12 11V17"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M4 7H20"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M17 7L15.987 4.298C15.694 3.517 14.948 3 14.114 3H9.886C9.052 3 8.306 3.517 8.013 4.298L7 7"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M15.43 11L15 17"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M8.57003 11L9.00003 17"
                        stroke="#d1d5db"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span
                      class="absolute hidden group-hover:block bg-black text-white text-[10px] py-1 px-2 rounded -top-8 right-0 w-max z-10"
                      >Pro feature</span
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="!searchQuery"
          class="w-full flex flex-row items-center justify-between mt-8 mb-[30px] gap-4 sm:gap-0"
        >
          <p v-if="isPremium" class="text-[13px]">qalive 2.1.1</p>
          <button v-else class="text-[13px] underline hover:text-[#E85D4A]">
            Upgrade to premium plan
          </button>
          <div class="flex justify-end items-center space-x-4">
            <span class="text-[13px] text-gray-700">Page {{ page }} on {{ totalPages }}</span>
            <button @click="prevPage" :disabled="page === 1" class="disabled:opacity-50">
              <span class="material-symbols-outlined text-tertiary text-[14px]"
                >keyboard_double_arrow_left</span
              >
            </button>
            <button @click="nextPage" :disabled="page === totalPages" class="disabled:opacity-50">
              <span class="material-symbols-outlined text-tertiary text-[14px]"
                >keyboard_double_arrow_right</span
              >
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showModal"
          @click.self="showModal = false"
          class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <CreateSessionModal />
        </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showModal"
          @click.self="showModal = false"
          class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <CreateSessionModal />
        </div>
      </Transition>

      <Transition name="modal-fade">
        <div
          v-if="showUpgradePlanModal"
          @click.self="showUpgradePlanModal = false"
          class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        >
          <UpgradePlanModal />
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>
