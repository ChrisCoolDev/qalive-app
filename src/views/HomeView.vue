<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/layouts/AppLayout.vue'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'
import CreateSessionModal from '@/components/basis/CreateSessionModal.vue'
import DashboardCard from '@/components/basis/dashboardCard.vue'
import { formatTimeLocal, formatDateLocal } from '@/utils/dateHelper'
import { exposeDashboardaInformations } from '@/datas/dashboardDatas'
import { supabase } from '@/lib/supabase'

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
  errorUpgradeMessage,
  totalPages,
  user,
} = storeToRefs(sessionStore)

const { fetchDashboardData, nextPage, prevPage, handleUpgrade } = sessionStore

function openModal() {
  showModal.value = true
}

onMounted(async () => {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  // Vérifier si l'utilisateur revient d'un paiement réussi
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('success') === 'true') {
    // Attendre un peu pour laisser le webhook se traiter
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Recharger les données utilisateur
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      // Forcer le rafraîchissement du profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, plan')
        .eq('id', session.user.id)
        .single()

      if (profile?.is_premium) {
        // Afficher un message de succès
        alert('Welcome to Premium! 🎉')
      } else {
        // Si pas encore premium, peut-être que le webhook est en retard
        console.log('Payment successful, waiting for webhook processing...')
      }
    }

    // Nettoyer l'URL
    window.history.replaceState({}, '', window.location.pathname)
  }

  await fetchDashboardData()
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

  console.log(expiresAt + ' ' + now.value)
  return expiresAt
}
</script>

<template>
  <AppLayout>
    <div class="mt-[28px]">
      <div class="mb-[35px] space-y-2">
        <h1 class="text-xxl font-semibold text-primary">Event management</h1>
        <p class="text-sm text-[#4F4F4F] font-mabry">
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
        <div
          class="flex items-center relative cursor-pointer"
          v-if="user && user.user_metadata"
          @click="redirectToUserProfilePage"
        >
          <img
            :src="user.user_metadata.picture"
            alt="profile picture of connected user"
            class="w-9 h-9 rounded-full border border-[#7738C7] mr-2"
          />
          <div class="-space-y-0">
            <p class="text-sm leading-[100%]">{{ user.user_metadata.name }}</p>
            <span class="text-[10px] text-gray-600 leading-[100%]">{{
              user.user_metadata.email
            }}</span>
          </div>
        </div>
        <button
          class="text-center px-[12px] font-medium py-1 text-[12px] leading-[100%] text-white bg-black rounded-[4px]"
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
                      now < localHourEnsured(session.expires_at)
                        ? 'bg-[#D9F3DD] text-[#2F8132]'
                        : 'bg-[#FFEAEA] text-[#DF5F5F]',
                      'px-3 py-1 rounded-full text-[11px] font-medium leading-[100%]',
                    ]"
                  >
                    {{ now < localHourEnsured(session.expires_at) ? 'active' : 'inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!--Pagination -->
        <div class="w-full flex items-center justify-between mt-8 mb-[30px]">
          <!-- PAR -->
          <a
            @click.prevent="handleUpgrade"
            href="#"
            class="underline text-[13px] cursor-pointer hover:text-purple-600"
          >
            Upgrade to a premium plan !
          </a>
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
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showUpgradePlanModal"
          @click.self="showUpgradePlanModal = false"
          class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <div class="space-y-4 bg-white rounded-[6px] px-6 py-8 max-w-[350px] w-full relative">
            <div
              @click="showUpgradePlanModal = false"
              class="absolute top-3 right-5 text-3xl font-light text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined"> close_small </span>
            </div>
            <h2 class="text-lg font-medium text-primary mb-6">Upgrade to premium plan</h2>

            <p class="text-[14px] text-gray-700">{{ errorUpgradeMessage }}</p>
            <!-- PAR -->
            <button
              type="submit"
              class="w-full py-3 px-4 bg-black text-white rounded text-[13px]"
              @click="handleUpgrade"
            >
              Upgrade now
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>
