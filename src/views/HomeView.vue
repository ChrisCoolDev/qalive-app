<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'
import { useQuestionStore } from '@/stores/questionStore'
import { supabase } from '@/lib/supabase'
import CreateSessionModal from '@/components/basis/CreateSessionModal.vue'
import DashboardCard from '@/components/basis/dashboardCard.vue'
import { formatDateLocal, parseUTCDate } from '@/utils/dateHelper'
import { exposeDashboardaInformations } from '@/datas/dashboardDatas'
import UpgradePlanModal from '@/components/basis/UpgradePlanModal.vue'
import SessionSideBar from '@/components/layouts/SessionSideBar/SessionSideBar.vue'
import ShareSessionQrModal from '@/components/basis/ShareSessionQrModal.vue'
import QuestionFocusModal from '@/components/basis/QuestionFocusModal.vue'
import { analytics } from '@/lib/analytics'
import { cleanAuthUrl } from '@/utils/urlHelper'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const questionStore = useQuestionStore()
const { questions: sidebarQuestions } = storeToRefs(questionStore)

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
  isPremium,
} = storeToRefs(sessionStore)

const { fetchDashboardData, nextPage, prevPage, deleteSession } = sessionStore

const tabs = [
  { key: 'All', label: 'All', widthClass: 'w-[51px]' },
  { key: 'Active', label: 'Active', widthClass: 'w-[73px]' },
  { key: 'Upcoming', label: 'Upcoming', widthClass: 'w-[97px]' },
  { key: 'Expired', label: 'Expired', widthClass: 'w-[73px]' },
]
const activeTab = ref('All')
const searchQuery = ref('')
const allSessions = ref([])
const selectedSession = ref(null)
const qrModalSession = ref(null)
const focusedQuestion = ref(null)
const now = ref(new Date())
let timer

function localHourEnsured(dateString) {
  return parseUTCDate(dateString) || new Date(0)
}

function getSessionStatus(session) {
  if (session.starts_at && now.value < localHourEnsured(session.starts_at)) {
    return 'Upcoming'
  }
  const expiresAt = localHourEnsured(session.expires_at)
  if ((session.expires_at && now.value >= expiresAt) || session.is_active === false) {
    return 'Expired'
  }
  return 'Active'
}

function isPrivateSession(session) {
  const code = session?.access_code ?? session?.accessCode
  if (code === null || code === undefined) return false
  const trimmed = String(code).trim()
  return trimmed.length > 0 && trimmed.toLowerCase() !== 'null'
}

function capitalizeFirstLetter(value) {
  if (!value) return ''
  const str = String(value).trim()
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const filteredSessions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const isFiltering = Boolean(query) || activeTab.value !== 'All'
  const sourceList =
    isFiltering && allSessions.value.length > 0 ? allSessions.value : sessions.value

  return sourceList.filter((session) => {
    const matchesQuery = !query || session.name?.toLowerCase().includes(query)
    const status = getSessionStatus(session)
    const matchesTab = activeTab.value === 'All' || status === activeTab.value
    return matchesQuery && matchesTab
  })
})

const showTable = computed(() => totalSessions.value > 0)

function openModal() {
  if (!isPremium.value && totalSessions.value >= 1) {
    showUpgradePlanModal.value = true
    analytics.trackEvent('upgrade_modal_opened', { reason: 'free_session_limit_reached' })
    return
  }
  showModal.value = true
}

async function handleDeleteSession(sessionId) {
  if (selectedSession.value?.id === sessionId) {
    selectedSession.value = null
  }
  await deleteSession(sessionId)
  await loadAllSessions()
}

function openSessionSidebar(session) {
  selectedSession.value = session
  if (session?.slug) {
    router.replace({ path: '/overview', query: { ...route.query, session: session.slug } })
  }
}

function closeSessionSidebar() {
  selectedSession.value = null
  focusedQuestion.value = null
  const nextQuery = { ...route.query }
  delete nextQuery.session
  delete nextQuery.qr
  router.replace({ path: '/overview', query: nextQuery })
}

function openShareQr(session) {
  if (session) {
    qrModalSession.value = session
  }
}

function openQuestionFocus(question) {
  if (question) {
    focusedQuestion.value = question
  }
}

async function loadAllSessions() {
  try {
    if (!user.value?.id) return
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

    const querySlug = route.query?.session
    if (querySlug && !selectedSession.value) {
      const found =
        allSessions.value.find((s) => s.slug === querySlug) ||
        sessions.value.find((s) => s.slug === querySlug)
      if (found) {
        selectedSession.value = found
        if (route.query?.qr === '1') {
          qrModalSession.value = found
        }
      }
    }
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  cleanAuthUrl()

  await fetchDashboardData()
  await loadAllSessions()
  timer = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const redirectToUserProfilePage = () => (window.location.href = '/profile')
const openUpgradeModal = () => {
  showUpgradePlanModal.value = true
  analytics.trackEvent('upgrade_modal_opened', { source: 'dashboard_footer' })
}
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
            {{ user.user_metadata.name.split(' ')[0] }}'s Workspace
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
          <p class="text-[14px] text-[#777] font-mabry">Engage your audience with live Q&amp;A.</p>
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
        <h3 class="text-base font-medium text-gray-900">No sessions yet</h3>
        <p class="text-[13px] max-w-sm">
          Create your first Q&amp;A session and share the link or QR code with your audience.
        </p>
        <button
          @click="openModal"
          class="px-4 py-2 text-xs font-medium text-white bg-[#E85D4A] rounded-[4px] hover:bg-[#d44d3c] transition-colors"
        >
          + Create your first session
        </button>
      </div>

      <div v-else-if="showTable" class="flex flex-col gap-[23px] items-start w-full">
        <!-- Search bar (Figma node 320:135) -->
        <div class="flex items-center gap-[4px] w-full sm:w-[294px]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="shrink-0"
          >
            <path
              d="M14 14L11.6736 11.6736M11.6736 11.6736L11.6667 11.6667M11.6736 11.6736C12.7363 10.6109 13.3333 9.16956 13.3333 7.66667C13.3333 6.16377 12.7363 4.72243 11.6736 3.65973C10.6109 2.59702 9.16956 2 7.66667 2C6.16377 2 4.72243 2.59702 3.65973 3.65973C2.59702 4.72243 2 6.16377 2 7.66667C2 9.16956 2.59702 10.6109 3.65973 11.6736C4.72243 12.7363 6.16377 13.3333 7.66667 13.3333C9.16956 13.3333 10.6109 12.7363 11.6736 11.6736Z"
              stroke="#959595"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search a session..."
            class="bg-transparent outline-none text-[14px] text-black placeholder-[#959595] font-normal w-full"
          />
        </div>

        <div class="flex flex-col gap-[21px] items-end w-full">
          <!-- Tabs & New session button (Figma node 340:402) -->
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 w-full"
          >
            <div class="bg-[#f3f3f3] flex items-center p-[2px] rounded-[20px] shrink-0">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                @click="activeTab = tab.key"
                :class="[
                  tab.widthClass,
                  activeTab === tab.key
                    ? 'bg-white border border-[#ececec] border-solid font-semibold text-black'
                    : 'font-medium text-[#5a5a5a] hover:text-black',
                  'flex flex-col h-[36px] items-center justify-center p-[10px] rounded-[20px] shrink-0 text-[14px] text-center whitespace-nowrap transition-all',
                ]"
              >
                {{ tab.label }}
              </button>
            </div>

            <button
              type="button"
              @click="openModal"
              class="bg-[#E85D4A] hover:bg-[#d44d3c] flex h-[31px] items-center justify-center p-[10px] rounded-[4px] shrink-0 text-[14px] font-medium text-white whitespace-nowrap transition-colors"
            >
              New session
            </button>
          </div>

          <!-- Sessions Table (Figma node 340:406) -->
          <div class="w-full overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr class="border-b border-[#E6E6E6] text-[13px] text-[#5a5a5a] font-normal">
                  <th class="pb-[6px] font-normal w-[38%]">Session</th>
                  <th class="pb-[6px] font-normal">Created at</th>
                  <th class="pb-[6px] font-normal">Close at</th>
                  <th class="pb-[6px] font-normal">Attenders</th>
                  <th class="pb-[6px] font-normal">Status</th>
                  <th class="pb-[6px] font-normal text-right">Action</th>
                </tr>
              </thead>

              <tbody v-if="filteredSessions.length === 0">
                <tr>
                  <td colspan="6" class="py-10 text-center text-[13px] text-[#7b7b7b]">
                    No sessions found.
                  </td>
                </tr>
              </tbody>

              <tbody v-else class="before:block before:h-[13px] before:content-['']">
                <tr
                  v-for="session in filteredSessions"
                  :key="session.id"
                  :class="[
                    'hover:bg-gray-50/70 cursor-pointer transition-colors',
                    selectedSession?.id === session.id ? 'bg-gray-50' : '',
                  ]"
                  @click="openSessionSidebar(session)"
                >
                  <!-- Session column -->
                  <td class="py-[7px] pr-4">
                    <div class="flex items-center gap-[5px]">
                      <div class="relative shrink-0 w-[18px] h-[18px]">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          class="block w-full h-full"
                        >
                          <path
                            d="M3.9375 6.1875H7.3125M7.3125 6.1875H11.8125M7.3125 6.1875L8.2125 1.6875M7.3125 6.1875L6.1875 11.8125M11.8125 6.1875H15.1875M11.8125 6.1875L12.7125 1.6875M11.8125 6.1875L10.6875 11.8125M2.8125 11.8125H6.1875M6.1875 11.8125H10.6875M6.1875 11.8125L5.2875 16.3125M10.6875 11.8125H14.0625M10.6875 11.8125L9.7875 16.3125"
                            stroke="#0D0D0D"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </div>
                      <div class="flex flex-col items-start w-[223px] max-w-[223px]">
                        <p
                          class="text-[14px] text-black font-normal leading-normal truncate w-full first-letter:uppercase"
                          :title="capitalizeFirstLetter(session.name)"
                        >
                          {{ capitalizeFirstLetter(session.name) }}
                        </p>
                        <div class="flex items-end gap-[4px]">
                          <p
                            class="text-[11px] text-[#7b7b7b] font-normal leading-none whitespace-nowrap"
                          >
                            {{ isPrivateSession(session) ? 'Private' : 'Public' }}
                          </p>
                          <div class="relative shrink-0 w-[14px] h-[14px] flex items-end">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              class="block w-full h-full"
                            >
                              <path
                                v-if="isPrivateSession(session)"
                                d="M4.08333 5.83333V4.66667C4.08333 3.05584 5.38917 1.75 7 1.75C8.61083 1.75 9.91667 3.05584 9.91667 4.66667V5.83333M7 8.45833V9.625M5.13333 12.25H8.86667C9.84667 12.25 10.3367 12.25 10.7112 12.0592C11.0404 11.8915 11.3081 11.6238 11.4759 11.2945C11.6667 10.92 11.6667 10.43 11.6667 9.45V8.63333C11.6667 7.65333 11.6667 7.16333 11.4759 6.78883C11.3081 6.45956 11.0404 6.19186 10.7112 6.02408C10.3367 5.83333 9.84667 5.83333 8.86667 5.83333H5.13333C4.15333 5.83333 3.66333 5.83333 3.28883 6.02408C2.95956 6.19186 2.69186 6.45956 2.52408 6.78883C2.33333 7.16333 2.33333 7.65333 2.33333 8.63333V9.45C2.33333 10.43 2.33333 10.92 2.52408 11.2945C2.69186 11.6238 2.95956 11.8915 3.28883 12.0592C3.66333 12.25 4.15333 12.25 5.13333 12.25Z"
                                stroke="#7B7B7B"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                v-else
                                d="M4.08333 5.83333V4.66667C4.08289 3.99625 4.31343 3.34615 4.73613 2.82578C5.15884 2.30541 5.7479 1.94655 6.40418 1.8096C7.06046 1.67265 7.74389 1.76596 8.33943 2.07384C8.93497 2.38172 9.40627 2.88536 9.674 3.5M7 8.45833V9.625M5.13333 12.25H8.86667C9.84667 12.25 10.3367 12.25 10.7112 12.0592C11.0404 11.8915 11.3081 11.6238 11.4759 11.2945C11.6667 10.92 11.6667 10.43 11.6667 9.45V8.63333C11.6667 7.65333 11.6667 7.16333 11.4759 6.78883C11.3081 6.45956 11.0404 6.19186 10.7112 6.02408C10.3367 5.83333 9.84667 5.83333 8.86667 5.83333H8.86667H5.13333H5.13333C4.15333 5.83333 3.66333 5.83333 3.28883 6.02408C2.95956 6.19186 2.69186 6.45956 2.52408 6.78883C2.33333 7.16333 2.33333 7.65333 2.33333 8.63333V9.45C2.33333 10.43 2.33333 10.92 2.52408 11.2945C2.69186 11.6238 2.95956 11.8915 3.28883 12.0592C3.66333 12.25 4.15333 12.25 5.13333 12.25Z"
                                stroke="#7B7B7B"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Created at -->
                  <td class="py-[7px] text-[14px] text-black font-normal whitespace-nowrap">
                    {{ formatDateLocal(session.created_at) }}
                  </td>

                  <!-- Close at -->
                  <td class="py-[7px] text-[14px] text-black font-normal whitespace-nowrap">
                    {{ session.expires_at ? formatDateLocal(session.expires_at) : '-' }}
                  </td>

                  <!-- Attenders -->
                  <td class="py-[7px] text-[14px] text-black font-normal whitespace-nowrap">
                    {{ session.questionCount || 0 }}
                  </td>

                  <!-- Status -->
                  <td class="py-[7px]">
                    <div
                      v-if="getSessionStatus(session) === 'Active'"
                      class="bg-[rgba(66,168,35,0.2)] border border-[#42a823] border-solid inline-flex h-[20px] items-center justify-center px-[10px] rounded-[4px]"
                    >
                      <span class="text-[#42a823] text-[10px] font-normal leading-normal whitespace-nowrap">
                        Active
                      </span>
                    </div>
                    <div
                      v-else-if="getSessionStatus(session) === 'Upcoming'"
                      class="bg-[rgba(55,151,189,0.2)] border border-[#3797bd] border-solid inline-flex h-[20px] items-center justify-center px-[10px] rounded-[4px]"
                    >
                      <span class="text-[#3797bd] text-[10px] font-normal leading-normal whitespace-nowrap">
                        Upcoming
                      </span>
                    </div>
                    <div
                      v-else
                      class="bg-[rgba(235,130,120,0.2)] border border-[#eb8278] border-solid inline-flex h-[20px] items-center justify-center px-[10px] rounded-[4px]"
                    >
                      <span class="text-[#eb8278] text-[10px] font-normal leading-normal whitespace-nowrap">
                        Expired
                      </span>
                    </div>
                  </td>

                  <!-- Action -->
                  <td class="py-[7px] text-right">
                    <button
                      v-if="isPremium"
                      type="button"
                      @click.stop="handleDeleteSession(session.id)"
                      class="inline-flex items-center justify-center w-[16px] h-[16px] hover:opacity-75 transition-opacity"
                      title="Delete session"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.33333 8C5.33333 8.35362 5.19286 8.69276 4.94281 8.94281C4.69276 9.19286 4.35362 9.33333 4 9.33333C3.64638 9.33333 3.30724 9.19286 3.05719 8.94281C2.80714 8.69276 2.66667 8.35362 2.66667 8C2.66667 7.64638 2.80714 7.30724 3.05719 7.05719C3.30724 6.80714 3.64638 6.66667 4 6.66667C4.35362 6.66667 4.69276 6.80714 4.94281 7.05719C5.19286 7.30724 5.33333 7.64638 5.33333 8ZM9.33333 8C9.33333 8.35362 9.19286 8.69276 8.94281 8.94281C8.69276 9.19286 8.35362 9.33333 8 9.33333C7.64638 9.33333 7.30724 9.19286 7.05719 8.94281C6.80714 8.69276 6.66667 8.35362 6.66667 8C6.66667 7.64638 6.80714 7.30724 7.05719 7.05719C7.30724 6.80714 7.64638 6.66667 8 6.66667C8.35362 6.66667 8.69276 6.80714 8.94281 7.05719C9.19286 7.30724 9.33333 7.64638 9.33333 8ZM12 9.33333C12.3536 9.33333 12.6928 9.19286 12.9428 8.94281C13.1929 8.69276 13.3333 8.35362 13.3333 8C13.3333 7.64638 13.1929 7.30724 12.9428 7.05719C12.6928 6.80714 12.3536 6.66667 12 6.66667C11.6464 6.66667 11.3072 6.80714 11.0572 7.05719C10.8071 7.30724 10.6667 7.64638 10.6667 8C10.6667 8.35362 10.8071 8.69276 11.0572 8.94281C11.3072 9.19286 11.6464 9.33333 12 9.33333Z"
                          fill="#666666"
                        />
                      </svg>
                    </button>
                    <div v-else class="group relative inline-flex items-center justify-center">
                      <svg
                        class="cursor-not-allowed"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.33333 8C5.33333 8.35362 5.19286 8.69276 4.94281 8.94281C4.69276 9.19286 4.35362 9.33333 4 9.33333C3.64638 9.33333 3.30724 9.19286 3.05719 8.94281C2.80714 8.69276 2.66667 8.35362 2.66667 8C2.66667 7.64638 2.80714 7.30724 3.05719 7.05719C3.30724 6.80714 3.64638 6.66667 4 6.66667C4.35362 6.66667 4.69276 6.80714 4.94281 7.05719C5.19286 7.30724 5.33333 7.64638 5.33333 8ZM9.33333 8C9.33333 8.35362 9.19286 8.69276 8.94281 8.94281C8.69276 9.19286 8.35362 9.33333 8 9.33333C7.64638 9.33333 7.30724 9.19286 7.05719 8.94281C6.80714 8.69276 6.66667 8.35362 6.66667 8C6.66667 7.64638 6.80714 7.30724 7.05719 7.05719C7.30724 6.80714 7.64638 6.66667 8 6.66667C8.35362 6.66667 8.69276 6.80714 8.94281 7.05719C9.19286 7.30724 9.33333 7.64638 9.33333 8ZM12 9.33333C12.3536 9.33333 12.6928 9.19286 12.9428 8.94281C13.1929 8.69276 13.3333 8.35362 13.3333 8C13.3333 7.64638 13.1929 7.30724 12.9428 7.05719C12.6928 6.80714 12.3536 6.66667 12 6.66667C11.6464 6.66667 11.3072 6.80714 11.0572 7.05719C10.8071 7.30724 10.6667 7.64638 10.6667 8C10.6667 8.35362 10.8071 8.69276 11.0572 8.94281C11.3072 9.19286 11.6464 9.33333 12 9.33333Z"
                          fill="#666666"
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
        </div>

        <div
          v-if="!searchQuery"
          class="w-full flex flex-row items-center justify-between mt-8 mb-[30px] gap-4 sm:gap-0"
        >
          <p v-if="isPremium" class="text-[13px]">qalive 2.1.1</p>
          <button
            v-else
            @click="openUpgradeModal"
            class="text-[13px] underline hover:text-[#E85D4A]"
          >
            Upgrade to Pro →
          </button>
          <div class="flex justify-end items-center space-x-4">
            <span class="text-[13px] text-gray-700">Page {{ page }} of {{ totalPages }}</span>
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
      <Transition name="sidebar-slide">
        <SessionSideBar
          v-if="selectedSession"
          :session="selectedSession"
          @close="closeSessionSidebar"
          @open-share-qr="openShareQr"
          @select-question="openQuestionFocus"
        />
      </Transition>

      <Transition name="modal-fade">
        <div
          v-if="qrModalSession"
          @click.self="qrModalSession = null"
          class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        >
          <ShareSessionQrModal :session="qrModalSession" @close="qrModalSession = null" />
        </div>
      </Transition>

      <Transition name="modal-fade">
        <QuestionFocusModal
          v-if="focusedQuestion"
          :questions="sidebarQuestions"
          :initial-question="focusedQuestion"
          :session="selectedSession"
          :is-premium="isPremium"
          @close="focusedQuestion = null"
        />
      </Transition>

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
          class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
        >
          <UpgradePlanModal />
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<style scoped>
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
