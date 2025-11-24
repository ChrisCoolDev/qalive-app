<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'
import { supabase } from '@/lib/supabase'
import CreateSessionModal from '@/components/basis/CreateSessionModal.vue'
import DashboardCard from '@/components/basis/dashboardCard.vue'
import { formatTimeLocal, formatDateLocal } from '@/utils/dateHelper'
import { exposeDashboardaInformations } from '@/datas/dashboardDatas'

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
  totalPages,
  user,
} = storeToRefs(sessionStore)

const { fetchDashboardData, nextPage, prevPage } = sessionStore

// État pour la recherche
const searchQuery = ref('')
const allSessions = ref([])

// Sessions filtrées basées sur la recherche
const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) {
    return sessions.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return allSessions.value.filter((session) => session.name.toLowerCase().includes(query))
})

// Afficher un message si aucune session ne correspond à la recherche
const showNoResults = computed(() => {
  return searchQuery.value.trim() && filteredSessions.value.length === 0
})

// Afficher le tableau si on a des sessions ou des résultats de recherche
const showTable = computed(() => {
  return totalSessions.value > 0 && !showNoResults.value
})

function openModal() {
  showModal.value = true
}

// Charger toutes les sessions pour la recherche
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
    console.error('Error loading all sessions:', err)
  }
}

onMounted(async () => {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  await fetchDashboardData()
  await loadAllSessions()
})

const redirectToQuestionsView = (sessionSlug) => {
  window.location.href = `/session/${sessionSlug}`
}

const redirectToUserProfilePage = () => {
  window.location.href = '/profile'
}

const dashboardInformations = computed(() =>
  exposeDashboardaInformations(totalSessions, totalQuestions, activeSessions),
)

const now = ref(new Date())

function localHourEnsured(date) {
  const expires = new Date(date)
  const expiresAt = new Date(expires.getTime() + 3 * 60 * 60 * 1000)
  return expiresAt
}
</script>

<template>
  <AppLayout>
    <div class="mt-[28px]">
      <div class="mb-[35px] flex items-center justify-between" v-if="user && user.user_metadata">
        <div class="space-y-1">
          <h1 class="text-lg font-medium text-primary">
            🌤️ Hi {{ user.user_metadata.name.split(' ')[0] }},
          </h1>
          <p class="text-[14px] text-[#777] font-mabry">Track your audience engagement.</p>
        </div>
        <div class="cursor-pointer" @click="redirectToUserProfilePage">
          <img
            :src="user.user_metadata.picture"
            alt="profile picture of connected user"
            class="w-9 h-9 rounded-[4px] border border-[#E85D4A] ml-2"
          />
        </div>
      </div>

      <!-- Cartes du Dashboard -->
      <div class="grid grid-cols-3 gap-x-[12px] mb-[45px]">
        <DashboardCard
          v-for="(information, index) in dashboardInformations"
          :key="index"
          :dashboardInformation="information"
        />
      </div>

      <!-- Barre de recherche et button new session -->
      <div class="flex justify-between mb-6 items-center">
        <!-- Barre de recherche -->
        <div
          class="py-[6px] px-2 w-max border border-[#E6E6E6] bg-gray-50 flex space-x-2 items-center rounded-[4px]"
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
              d="M15.7138 6.8382C18.1647 9.28913 18.1647 13.2629 15.7138 15.7138C13.2629 18.1647 9.28913 18.1647 6.8382 15.7138C4.38727 13.2629 4.38727 9.28913 6.8382 6.8382C9.28913 4.38727 13.2629 4.38727 15.7138 6.8382"
              stroke="#9ca3af "
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M19 19L15.71 15.71"
              stroke="#9ca3af "
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search sessions..."
            class="bg-transparent outline-none text-[13px] text-[#161924] placeholder-gray-400 w-[200px]"
          />
        </div>
        <button
          class="text-center px-[12px] font-medium py-[10px] text-[12px] leading-[100%] text-white bg-[#E85D4A] rounded-[4px]"
          @click="openModal"
        >
          New session
        </button>
      </div>

      <!-- Affichage conditionnel -->
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
        <img src="/illustrations/empty2.svg" alt="" />
        <p class="text-[13px]">You didn't create an event yet</p>
      </div>

      <!-- Message si aucun résultat de recherche -->
      <div v-else-if="showNoResults" class="text-center text-gray-500 py-10 text-sm">
        No sessions found matching
      </div>

      <!-- Tableau des sessions -->
      <div v-else-if="showTable">
        <div class="overflow-x-auto rounded-[4px] border border-[#E6E6E6]">
          <table class="w-full divide-y divide-[#E6E6E6] text-left">
            <thead class="text-[12px] text-gray-600 bg-[#F6F5EF]">
              <tr>
                <th scope="col" class="py-3 px-6 font-medium">Event name</th>
                <th scope="col" class="py-3 px-6 font-medium">Attempted questions</th>
                <th scope="col" class="py-3 px-6 font-medium">Creation</th>
                <th scope="col" class="py-3 px-6 font-medium">Expiration</th>
                <th scope="col" class="py-3 px-6 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E6E6E6]">
              <tr
                v-for="session in filteredSessions"
                :key="session.id"
                class="hover:bg-gray-50 cursor-pointer"
                @click="redirectToQuestionsView(session.slug)"
              >
                <td class="py-3 px-6 truncate text-sm max-w-xs font-medium">
                  {{ session.name }}
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
                <td class="py-3 flex justify-end items-center px-6">
                  <div
                    :class="[
                      now < localHourEnsured(session.expires_at) ? 'bg-[#D9F3DD]' : 'bg-gray-100',
                      'px-2 py-1 rounded-[4px] w-max mt-2',
                    ]"
                  >
                    <p
                      :class="[
                        now < localHourEnsured(session.expires_at)
                          ? 'text-[#2F8132]'
                          : 'text-gray-600',
                        'text-[11px] font-medium leading-none mb-[2px]',
                      ]"
                    >
                      {{ now < localHourEnsured(session.expires_at) ? 'active' : 'inactive' }}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="w-full flex items-center justify-between mt-8 mb-[30px]">
          <p class="text-[13px]">qalive 2.0.1</p>
          <div class="flex justify-end items-center space-x-4">
            <span class="text-[13px] text-gray-700 leading-[100%]"
              >Page {{ page }} on {{ totalPages }}</span
            >
            <button
              @click="prevPage"
              :disabled="page === 1"
              class="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-symbols-outlined text-tertiary text-[14px]">
                keyboard_double_arrow_left
              </span>
            </button>
            <button
              @click="nextPage"
              :disabled="page === totalPages"
              class="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-symbols-outlined text-tertiary text-[14px]">
                keyboard_double_arrow_right
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal avec overlay -->
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
  </AppLayout>
</template>
