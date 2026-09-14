<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppLayout from '@/layouts/AppLayout.vue'
import { useSessionStore } from '@/stores/sessionStore'
import { supabase } from '@/lib/supabase'
import CreateSessionModal from '@/components/features/CreateSessionModal.vue'
import UpgradePlanModal from '@/components/features/UpgradePlanModal.vue'
import DashboardCard from '@/components/ui/DashboardCard.vue'
import KanbanBoard from '@/components/features/KanbanBoard.vue'
import { exposeDashboardaInformations } from '@/datas/dashboardDatas'
import type { Session } from '@/types'

const sessionStore = useSessionStore()
const {
  totalSessions,
  totalQuestions,
  activeSessions,
  loading,
  errorMsg,
  showModal,
  showUpgradePlanModal,
  activeSidebarTab,
  user,
  isPremium,
} = storeToRefs(sessionStore)

const { fetchDashboardData, deleteSession: apiDeleteSession } = sessionStore

const searchQuery = ref('')
const allSessions = ref<Session[]>([])

// Local storage filters for Archive and Trash
const archivedSessionIds = ref<number[]>([])
const deletedSessionIds = ref<number[]>([])

const loadFilters = () => {
  archivedSessionIds.value = JSON.parse(localStorage.getItem('archived_sessions') || '[]')
  deletedSessionIds.value = JSON.parse(localStorage.getItem('deleted_sessions') || '[]')
}

const saveFilters = () => {
  localStorage.setItem('archived_sessions', JSON.stringify(archivedSessionIds.value))
  localStorage.setItem('deleted_sessions', JSON.stringify(deletedSessionIds.value))
}

const handleArchiveSession = (id: number) => {
  if (!archivedSessionIds.value.includes(id)) {
    archivedSessionIds.value.push(id)
    saveFilters()
  }
}

const handleUnarchiveSession = (id: number) => {
  archivedSessionIds.value = archivedSessionIds.value.filter(sid => sid !== id)
  saveFilters()
}

const handleDeleteSession = async (id: number) => {
  if (activeSidebarTab.value === 'trash') {
    const confirmed = confirm('Voulez-vous vraiment supprimer définitivement cette session ?')
    if (!confirmed) return
    const success = await apiDeleteSession(id)
    if (success) {
      deletedSessionIds.value = deletedSessionIds.value.filter(sid => sid !== id)
      saveFilters()
      await loadAllSessions()
    }
  } else {
    if (!deletedSessionIds.value.includes(id)) {
      deletedSessionIds.value.push(id)
      saveFilters()
    }
  }
}

const handleRestoreSession = (id: number) => {
  deletedSessionIds.value = deletedSessionIds.value.filter(sid => sid !== id)
  saveFilters()
}

async function loadAllSessions() {
  if (!user.value?.id) return
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, questions(id)')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const nowUTC = new Date()
    allSessions.value = (data || []).map((session: any) => {
      const expires = session.expires_at ? new Date(session.expires_at) : null
      const expiresAt = expires ? new Date(expires.getTime() + 3 * 60 * 60 * 1000) : null
      return {
        id: session.id,
        slug: session.slug,
        createdAt: session.created_at,
        created_at: session.created_at,
        name: session.name,
        isActive: session.expires_at ? (expiresAt ? expiresAt > nowUTC : true) : true,
        is_active: session.expires_at ? (expiresAt ? expiresAt > nowUTC : true) : true,
        accessCode: session.access_code,
        expiresAt: session.expires_at,
        userId: session.user_id,
        logoUrl: session.logo_url,
        questionCount: session.questions?.length || 0,
      }
    })
  } catch (err) {
    console.error(err)
  }
}

const visibleSessions = computed(() => {
  let list = allSessions.value

  // Apply Search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    list = list.filter(s => s.name.toLowerCase().includes(query))
  }

  // Filter sidebar tab
  if (activeSidebarTab.value === 'trash') {
    return list.filter(s => deletedSessionIds.value.includes(s.id))
  } else if (activeSidebarTab.value === 'archive') {
    return list.filter(s => archivedSessionIds.value.includes(s.id) && !deletedSessionIds.value.includes(s.id))
  } else {
    return list.filter(s => !archivedSessionIds.value.includes(s.id) && !deletedSessionIds.value.includes(s.id))
  }
})

const dashboardInformations = computed(() =>
  exposeDashboardaInformations(totalSessions, totalQuestions, activeSessions),
)

onMounted(async () => {
  const url = new URL(window.location.href)
  if (url.searchParams.has('checkout') || url.searchParams.has('order_id')) {
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  loadFilters()
  await fetchDashboardData()
  await loadAllSessions()
})

const openModal = () => {
  showModal.value = true
}

import SessionTypeSelectionModal from '@/components/features/SessionTypeSelectionModal.vue'

// ... existing code in setup ...

// Active database view tab (Notion database switcher)
const activeViewTab = ref<'board' | 'table' | 'calendar'>('board')

const isSearchActive = ref(false)
const isFilterActive = ref(false)
const isTypeSelectionModalOpen = ref(false)

const handleTypeSelection = (type: 'qna' | 'survey' | 'poll') => {
  isTypeSelectionModalOpen.value = false
  // For now, we open the existing modal, later we can pass the type.
  openModal()
}

const toggleSearch = () => {
  isSearchActive.value = true
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-6 pb-20 relative">


      <!-- Page Header Title -->
      <div class="space-y-2 mb-8" v-if="user?.user_metadata">
        <h1 class="text-[20px] font-medium text-black flex items-center ">
          Christian's Workspace
        </h1>
        <!--<p class="text-sm text-gray-400">Manage and coordinate Q&A interactions for all your workspaces.</p>-->
      </div>

      <!-- Stats section -->
      <!--<div v-if="activeSidebarTab === 'overview'" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <DashboardCard
          v-for="(info, index) in dashboardInformations"
          :key="index"
          :dashboardInformation="info"
        />
      </div>-->

      <!-- Notion Database Views (Board, Table, Calendar tabs) -->
      <div class=" mb-4 flex items-center justify-between text-sm select-none">
        <!--<div class="flex items-center space-x-4 -mb-[1px]">
          <div
            @click="activeViewTab = 'board'"
            class="flex items-center space-x-1.5 pb-2.5 px-1 cursor-pointer transition-colors border-b-2 font-medium"
            :class="activeViewTab === 'board' ? 'border-[#37352f] text-[#37352f]' : 'border-transparent text-gray-400 hover:text-gray-700'"
          >
            <span class="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Board view</span>
          </div>
          <div
            @click="activeViewTab = 'table'"
            class="flex items-center space-x-1.5 pb-2.5 px-1 cursor-pointer transition-colors border-b-2 font-medium"
            :class="activeViewTab === 'table' ? 'border-[#37352f] text-[#37352f]' : 'border-transparent text-gray-400 hover:text-gray-700'"
          >
            <span class="material-symbols-outlined text-[18px]">table_rows</span>
            <span>Table</span>
          </div>
          <div
            @click="activeViewTab = 'calendar'"
            class="flex items-center space-x-1.5 pb-2.5 px-1 cursor-pointer transition-colors border-b-2 font-medium"
            :class="activeViewTab === 'calendar' ? 'border-[#37352f] text-[#37352f]' : 'border-transparent text-gray-400 hover:text-gray-700'"
          >
            <span class="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>Calendar</span>
          </div>
        </div>-->

        <!-- Right: Actions & Search -->
        <div class="flex items-center justify-between space-x-2 w-full text-gray-500">

          <!-- Filter -->
          <div class="flex items-center ">

          <!-- Search -->
          <div class="flex items-center">
            <div class="flex items-center space-x-1.5 pl-1.5 pr-2">
              <svg class="frame" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 14L11.6667 11.6667M13.3333 7.66667C13.3333 9.16956 12.7363 10.6109 11.6736 11.6736C10.6109 12.7363 9.16956 13.3333 7.66667 13.3333C6.16377 13.3333 4.72243 12.7363 3.65973 11.6736C2.59702 10.6109 2 9.16956 2 7.66667C2 6.16377 2.59702 4.72243 3.65973 3.65973C4.72243 2.59702 6.16377 2 7.66667 2C9.16956 2 10.6109 2.59702 11.6736 3.65973C12.7363 4.72243 13.3333 6.16377 13.3333 7.66667Z" stroke="#959595" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Saisissez pour chercher..."
                class="bg-transparent outline-none text-[13px] text-gray-700 w-[150px] placeholder-[#959595] placeholder:font-light"
                @blur="!searchQuery && (isSearchActive = false)"
              />
            </div>
          </div>
          <div class="relative">
            <button @click="isFilterActive = !isFilterActive" class="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" :class="{ 'bg-blue-50 text-blue-500': isFilterActive }">
              <svg class="frame" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8H12M2 4H14M6 12H10" stroke="#504E4A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Filter Popover -->
            <div v-if="isFilterActive" class="absolute top-full mt-2 w-64 bg-white border border-gray-200 shadow-lg rounded-lg z-10 text-gray-700 py-2 right-0 md:right-auto md:-left-4">
              <div class="px-3 py-1 mb-1">
                 <input type="text" placeholder="Filtrer par..." class="w-full border border-blue-500 rounded-md px-2.5 py-1.5 text-[13px] outline-none shadow-sm focus:ring-1 focus:ring-blue-500">
              </div>
              <div class="px-3 py-1.5 hover:bg-gray-50 cursor-pointer flex items-center space-x-2.5 text-[13px]"><span class="material-symbols-outlined text-[16px] text-gray-500">business</span><span>Company Name</span></div>
              <div class="px-3 py-1.5 hover:bg-gray-50 cursor-pointer flex items-center space-x-2.5 text-[13px]"><span class="material-symbols-outlined text-[16px] text-gray-500">calendar_today</span><span>Application Date</span></div>
              <div class="px-3 py-1.5 hover:bg-gray-50 cursor-pointer flex items-center space-x-2.5 text-[13px]"><span class="material-symbols-outlined text-[16px] text-gray-500">link</span><span>Application Link / Portal</span></div>
              <div class="px-3 py-1.5 hover:bg-gray-50 cursor-pointer flex items-center space-x-2.5 text-[13px]"><span class="material-symbols-outlined text-[16px] text-gray-500">adjust</span><span>Application Status</span></div>
              <div class="border-t border-gray-100 my-1.5"></div>
              <div class="px-3 py-1.5 hover:bg-gray-50 cursor-pointer flex items-center space-x-2.5 text-[13px] text-gray-400"><span class="material-symbols-outlined text-[16px]">add</span><span>Ajouter un filtre avancé</span></div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- Core Display Panels -->
      <div v-if="loading && visibleSessions.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400 text-sm">
        <span class="material-symbols-outlined text-3xl animate-spin mb-2">autorenew</span>
        Loading events...
      </div>

      <div v-else-if="errorMsg" class="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
        {{ errorMsg }}
      </div>

      <div v-else class="space-y-6">
        <!-- Sidebar view contexts (Archive/Trash Header) -->
        <div v-if="activeSidebarTab !== 'overview'" class="flex items-center space-x-2 select-none border-l-2 border-gray-300 pl-3">
          <span class="material-symbols-outlined text-gray-400">
            {{ activeSidebarTab === 'archive' ? 'archive' : 'delete_outline' }}
          </span>
          <h2 class="text-xs font-bold text-gray-600 uppercase tracking-wider">
            {{ activeSidebarTab === 'archive' ? 'Archived Sessions' : 'Deleted Sessions (Trash)' }}
          </h2>
        </div>

        <!-- View Switchers logic -->
        <div v-if="activeViewTab === 'board'">
          <!-- Trash list -->
          <div v-if="activeSidebarTab === 'trash'" class="space-y-3">
            <div
              v-for="session in visibleSessions"
              :key="session.id"
              class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <span class="material-symbols-outlined text-gray-400">forum</span>
                <div>
                  <h4 class="text-sm font-semibold text-gray-800">{{ session.name }}</h4>
                  <p class="text-xs text-gray-400">Created: {{ new Date(session.createdAt).toLocaleDateString('fr-FR') }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="handleRestoreSession(session.id)"
                  class="px-2.5 py-1 text-[11px] font-semibold text-[#E85D4A] hover:bg-orange-50 rounded transition-colors"
                >
                  Restore
                </button>
                <button
                  @click="handleDeleteSession(session.id)"
                  class="px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
            <div
              v-if="visibleSessions.length === 0"
              class="text-center py-12 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg bg-white"
            >
              Trash is empty
            </div>
          </div>

          <!-- Archive list -->
          <div v-else-if="activeSidebarTab === 'archive'" class="space-y-3">
            <div
              v-for="session in visibleSessions"
              :key="session.id"
              class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <span class="material-symbols-outlined text-gray-400 font-medium">archive</span>
                <div>
                  <h4 class="text-sm font-semibold text-gray-800">{{ session.name }}</h4>
                  <p class="text-xs text-gray-400">Created: {{ new Date(session.createdAt).toLocaleDateString('fr-FR') }}</p>
                </div>
              </div>
              <button
                @click="handleUnarchiveSession(session.id)"
                class="px-2.5 py-1 text-[11px] font-semibold text-[#E85D4A] hover:bg-orange-50 rounded transition-colors"
              >
                Unarchive
              </button>
            </div>
            <div
              v-if="visibleSessions.length === 0"
              class="text-center py-12 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg bg-white"
            >
              No archived sessions
            </div>
          </div>

          <!-- Default Kanban Board -->
          <KanbanBoard
            v-else
            :sessions="visibleSessions"
            @delete-session="handleDeleteSession"
            @archive-session="handleArchiveSession"
          />
        </div>

        <!-- Table View Fallback -->
        <div v-else-if="activeViewTab === 'table'" class="overflow-x-auto rounded-lg border border-[#e3e1de] bg-white">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-[#e3e1de] text-gray-500 font-medium text-xs uppercase">
                <th class="p-3">Event Name</th>
                <th class="p-3">Access Code</th>
                <th class="p-3">Questions</th>
                <th class="p-3">Created</th>
                <th class="p-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="session in visibleSessions" :key="session.id" class="hover:bg-gray-50">
                <td class="p-3 font-semibold text-[#37352f]">{{ session.name }}</td>
                <td class="p-3 font-mono text-xs">{{ session.accessCode || 'public' }}</td>
                <td class="p-3">{{ session.questionCount || 0 }}</td>
                <td class="p-3 text-gray-500 text-xs">{{ new Date(session.createdAt).toLocaleDateString('fr-FR') }}</td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="session.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'">
                    {{ session.is_active ? 'Live' : 'Ended' }}
                  </span>
                </td>
              </tr>
              <tr v-if="visibleSessions.length === 0">
                <td colspan="5" class="p-8 text-center text-gray-400 text-xs">No events found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Calendar View Fallback -->
        <div v-else class="p-8 border border-dashed border-[#e3e1de] rounded-lg text-center text-gray-400 text-xs bg-white">
          <span class="material-symbols-outlined text-3xl mb-1">calendar_month</span>
          <p>Calendar rendering requires premium plan. Customize timelines dynamically.</p>
        </div>
      </div>
    </div>

    <!-- Modals -->
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
          class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        >
          <UpgradePlanModal />
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <SessionTypeSelectionModal
        :is-open="isTypeSelectionModalOpen"
        @close="isTypeSelectionModalOpen = false"
        @select="handleTypeSelection"
      />
    </Teleport>
  </AppLayout>
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
