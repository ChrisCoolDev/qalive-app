<script setup>
import { computed, onMounted } from 'vue'
import AppLayout from '@/components/layouts/AppLayout.vue'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'
import CreateSessionModal from '@/components/basis/CreateSessionModal.vue'
import DashboardCard from '@/components/basis/dashboardCard.vue'
import { useAuthSotre } from '@/stores/authStore'
import { formatTimeLocal, formatDateLocal } from '@/utils/dateHelper'

const sessionStore = useSessionStore()
const authStore = useAuthSotre()

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

const { logout } = authStore

const handleLogout = async () => {
  const success = await logout()
  if (success) {
    window.location.href = `/login`
  }
}

function openModal() {
  showModal.value = true
}

onMounted(async () => {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  await fetchDashboardData()
})

const redirectToQuestionsView = (sessionSlug) => {
  window.location.href = `/session/${sessionSlug}`
}

const dashboardInformations = computed(() => [
  {
    name: 'Total events',
    label: "All the sessions you've launched so far.",
    statistic: totalSessions,
    imagePath: '/illustrations/totalevents.svg',
  },
  {
    name: 'Total questions attempted',
    label: "Your audience's total engagement.",
    statistic: totalQuestions,
    imagePath: '/illustrations/totalquestions.svg',
  },
  {
    name: 'Active events',
    label: 'Sessions that are currently open for questions.',
    statistic: activeSessions,
    imagePath: '/illustrations/activeevents.svg',
  },
])
</script>

<template>
  <AppLayout>
    <div class="mt-[28px]">
      <div class="mb-[35px] space-y-2">
        <h1 class="text-xxl font-semibold text-primary">Event management</h1>
        <p class="text-sm text-[#4F4F4F]">
          Track your audience engagement and manage interactions in real-time.
        </p>
      </div>

      <!-- Cartes du Dashboard -->
      <div class="grid grid-cols-3 gap-x-[21px] mb-[45px]">
        <DashboardCard
          v-for="(information, index) in dashboardInformations"
          :key="index"
          :dashboardInformation="information"
        />
      </div>

      <!-- Barre de recherche et filtres -->
      <div class="flex justify-between mb-6">
        <div class="flex items-center relative" v-if="user && user.user_metadata">
          <img
            :src="user.user_metadata.picture"
            alt="profile picture of connected user"
            class="w-9 h-9 rounded-full border border-[#7738C7] mr-2"
          />
          <div class="-space-y-0">
            <p class="text-sm leading-[100%]">{{ user.user_metadata.name }}</p>
            <button @click="handleLogout" class="text-[10px] text-red-700 leading-[100%]">
              Disconnect
            </button>
          </div>
        </div>
        <button
          class="text-center px-[12px] font-medium py-1 text-[12px] leading-[100%] text-white bg-[#7738C7] rounded-[4px]"
          @click="openModal"
        >
          New event
        </button>
      </div>

      <!-- Affichage conditionnel -->
      <div v-if="loading && sessions.length === 0" class="text-center text-gray-500 py-10 text-sm">
        Loading...
      </div>
      <div v-else-if="errorMsg" class="text-center text-red-500 bg-red-100 p-4 rounded-md">
        {{ errorMsg }}
      </div>

      <div v-else-if="totalSessions > 0">
        <!-- Tableau -->
        <div class="overflow-x-auto rounded-[4px] border border-[#C8C8C8]">
          <table class="w-full divide-y divide-[#C8C8C8] text-left">
            <thead class="text-[12px] text-gray-600">
              <tr>
                <th scope="col" class="py-3 px-6 font-medium">Event name</th>
                <th scope="col" class="py-3 px-6 font-medium">Attempted questions</th>
                <th scope="col" class="py-3 px-6 font-medium">Creation</th>
                <th scope="col" class="py-3 px-6 font-medium">Expiration</th>
                <th scope="col" class="py-3 px-6 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#C8C8C8]">
              <tr
                v-for="session in sessions"
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
                <td class="py-3 text-right px-6">
                  <span
                    :class="[
                      session.is_active
                        ? 'bg-[#D9F3DD] text-[#2F8132]'
                        : 'bg-[#FFEAEA] text-[#DF5F5F]',
                    ]"
                    class="px-3 py-1 rounded-full text-[11px] font-medium leading-[100%]"
                  >
                    {{ session.is_active ? 'active' : 'inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!--Pagination -->
        <div class="flex justify-end items-center mt-8 space-x-4 mb-[30px]">
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

      <div v-else class="text-center text-gray-500 pt-[70px]">
        <p class="text-sm">You did'nt create an event yet</p>
      </div>
      <!--
      <NavBar />
      -->
    </div>

    <!-- modal with overlay -->
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
