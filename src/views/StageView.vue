<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import VueQrcode from 'qrcode.vue'
import { supabase } from '@/lib/supabase'
import { useQuestionStore } from '@/stores/questionStore'
import { useLiveRoom } from '@/composables/useLiveRoom'
import {
  LIVE_ROLES,
  LIVE_EVENTS,
  REACTION_CATALOG,
  isValidReactionKey,
  getReactionByKey,
  mapStageKeyToAction,
} from '@/lib/liveRoom'
import FloatingReactions from '@/components/live/FloatingReactions.vue'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug

const questionStore = useQuestionStore()
const { questions, currentSession, isOwnerPremium, loading, errorMsg } = storeToRefs(questionStore)
const { fetchQuestions, subscribeToQuestions, unsubscribeFromQuestions } = questionStore

const {
  audienceCount,
  connected: liveConnected,
  on: onLiveEvent,
} = useLiveRoom(slug, { role: LIVE_ROLES.STAGE })

const floatingRef = ref(null)
const highlightedIndex = ref(0)
const isBlackout = ref(false)
const isDarkStage = ref(false)
const isFullscreen = ref(false)
const totalReactions = ref(0)

const reactionCounts = reactive(
  Object.fromEntries(REACTION_CATALOG.map((item) => [item.key, 0])),
)

const joinUrl = computed(() =>
  typeof window !== 'undefined' && slug ? `${window.location.origin}/ask/${slug}` : `/ask/${slug}`,
)

const displayJoinUrl = computed(() => joinUrl.value.replace(/^https?:\/\//, ''))

const activeQuestion = computed(() => {
  if (!questions.value.length) return null
  const idx = Math.min(Math.max(highlightedIndex.value, 0), questions.value.length - 1)
  return questions.value[idx] || null
})

// Nombre de points affichés par colonne dans l'histogramme GDG (plafonné à 18 points visuels)
function getReactionDots(key) {
  const count = reactionCounts[key] || 0
  return Math.min(count, 18)
}

function selectQuestionByIndex(idx) {
  if (!questions.value.length) return
  if (idx < 0) {
    highlightedIndex.value = questions.value.length - 1
  } else if (idx >= questions.value.length) {
    highlightedIndex.value = 0
  } else {
    highlightedIndex.value = idx
  }
}

function nextQuestion() {
  selectQuestionByIndex(highlightedIndex.value + 1)
}

function prevQuestion() {
  selectQuestionByIndex(highlightedIndex.value - 1)
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  } catch {
    // Fullscreen bloqué ou non supporté
  }
}

function handleKeydown(e) {
  // Ignorer si focus dans un champ de saisie
  if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return

  const action = mapStageKeyToAction(e.key)
  if (!action) return

  if (action === 'next') {
    e.preventDefault()
    isBlackout.value = false
    nextQuestion()
  } else if (action === 'prev') {
    e.preventDefault()
    isBlackout.value = false
    prevQuestion()
  } else if (action === 'blackout') {
    e.preventDefault()
    isBlackout.value = !isBlackout.value
  } else if (action === 'fullscreen') {
    e.preventDefault()
    toggleFullscreen()
  } else if (action === 'clear') {
    isBlackout.value = false
  }
}

// Écoute des réactions du public en direct (Broadcast, 0 écriture BDD)
const offReaction = onLiveEvent(LIVE_EVENTS.REACTION, (payload) => {
  const key = payload?.key
  if (!isValidReactionKey(key)) return
  const item = getReactionByKey(key)
  if (!item) return

  reactionCounts[key] = (reactionCounts[key] || 0) + 1
  totalReactions.value += 1
  floatingRef.value?.spawn(item.emoji)
})

// Écoute de la question projetée depuis le dashboard speaker (/session/:slug)
const offHighlight = onLiveEvent(LIVE_EVENTS.HIGHLIGHT_QUESTION, (payload) => {
  const qId = payload?.questionId
  if (!qId) return
  const foundIdx = questions.value.findIndex((q) => q.id === qId)
  if (foundIdx !== -1) {
    highlightedIndex.value = foundIdx
    isBlackout.value = false
  }
})

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  await fetchQuestions(slug)

  if (currentSession.value?.id) {
    subscribeToQuestions(currentSession.value.id)

    // Récupère la question mise en avant dans session_live_state si la table est présente
    const { data: liveState } = await supabase
      .from('session_live_state')
      .select('highlighted_question_id')
      .eq('session_id', currentSession.value.id)
      .maybeSingle()

    if (liveState?.highlighted_question_id) {
      const idx = questions.value.findIndex((q) => q.id === liveState.highlighted_question_id)
      if (idx !== -1) highlightedIndex.value = idx
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  offReaction()
  offHighlight()
  unsubscribeFromQuestions()
})
</script>

<template>
  <div
    class="min-h-screen w-full flex flex-col justify-between transition-colors duration-300 select-none relative overflow-hidden"
    :class="isDarkStage ? 'bg-[#0F1117] text-white' : 'bg-[#FAF9F5] text-[#161924]'"
  >
    <!-- Cœurs et réactions flottantes -->
    <FloatingReactions ref="floatingRef" size="lg" />

    <!-- Écran noir (touche B des clickers USB) -->
    <div
      v-if="isBlackout"
      @click="isBlackout = false"
      class="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-pointer"
    >
      <p class="text-xs text-neutral-600 tracking-widest uppercase">
        Stage paused — press B or click to resume
      </p>
    </div>

    <!-- Barre supérieure : Marque, Titre, Compteurs Live, Contrôles Scène -->
    <header
      class="w-full px-6 md:px-12 py-5 border-b flex flex-wrap items-center justify-between gap-4 z-20"
      :class="isDarkStage ? 'border-white/10' : 'border-[#E6E6E6]'"
    >
      <div class="flex items-center gap-3 min-w-0">
        <img
          v-if="currentSession?.logo_url"
          :src="currentSession.logo_url"
          alt="Logo"
          class="w-9 h-9 rounded-full object-cover border border-[#E85D4A]"
        />
        <div
          v-else
          class="w-9 h-9 rounded-full bg-[#E85D4A] text-white flex items-center justify-center font-bold text-sm"
        >
          QA
        </div>
        <div class="truncate">
          <h1 class="text-base md:text-lg font-semibold truncate">
            {{ currentSession?.name || 'Live Stage' }}
          </h1>
          <p class="text-xs opacity-60">Interactive Stage View</p>
        </div>
      </div>

      <!-- Pastilles Live -->
      <div class="flex items-center flex-wrap gap-2.5">
        <span
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          :class="isDarkStage ? 'bg-white/10 text-white' : 'bg-[#F0EFE9] text-[#161924]'"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="liveConnected ? 'bg-[#2F8132] animate-pulse' : 'bg-gray-400'"
          ></span>
          {{ audienceCount }} {{ audienceCount === 1 ? 'participant' : 'participants' }}
        </span>

        <span
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          :class="isDarkStage ? 'bg-white/10 text-white' : 'bg-[#F0EFE9] text-[#161924]'"
        >
          <span>❤️</span>
          <span>{{ totalReactions }}</span>
        </span>

        <span
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          :class="isDarkStage ? 'bg-white/10 text-white' : 'bg-[#F0EFE9] text-[#161924]'"
        >
          <span>💬</span>
          <span>{{ questions.length }}</span>
        </span>

        <button
          type="button"
          @click="isDarkStage = !isDarkStage"
          class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
          :class="
            isDarkStage
              ? 'border-white/20 hover:bg-white/10'
              : 'border-gray-300 hover:bg-gray-200/60'
          "
          title="Switch Light / Dark stage theme"
        >
          {{ isDarkStage ? '☀️ Light' : '🌙 Dark' }}
        </button>

        <button
          type="button"
          @click="toggleFullscreen"
          class="px-3 py-1.5 rounded-full text-xs font-medium bg-[#E85D4A] text-white hover:bg-[#d44d3c] transition-colors"
          title="Fullscreen (F)"
        >
          {{ isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen' }}
        </button>

        <button
          type="button"
          @click="router.push(`/session/${slug}`)"
          class="px-3 py-1.5 rounded-full text-xs font-medium opacity-70 hover:opacity-100 hover:underline"
        >
          ← Backstage
        </button>
      </div>
    </header>

    <!-- Corps principal de l'écran de scène (2/3 Question & Pouls, 1/3 QR Code géant) -->
    <main class="flex-1 flex items-center px-6 md:px-12 py-8 z-20">
      <div v-if="loading" class="w-full text-center text-sm opacity-60">Loading stage…</div>

      <div v-else-if="errorMsg" class="w-full text-center text-red-500 text-base">
        {{ errorMsg }}
      </div>

      <div
        v-else
        class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
      >
        <!-- Colonne Gauche (8 cols) : Question projetée + Histogramme de réactions en points -->
        <div class="lg:col-span-8 flex flex-col justify-between space-y-8">
          <!-- Carte Question active ou État d'attente -->
          <div
            class="rounded-2xl p-8 md:p-12 border transition-all min-h-[280px] flex flex-col justify-between"
            :class="
              isDarkStage
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-[#E6E6E6] shadow-sm'
            "
          >
            <template v-if="activeQuestion">
              <div class="flex items-center justify-between text-xs uppercase tracking-wider opacity-60 mb-4">
                <span>
                  Question {{ highlightedIndex + 1 }} of {{ questions.length }}
                </span>
                <span>Asked by {{ activeQuestion.author_name || 'Anonymous' }}</span>
              </div>

              <blockquote
                class="text-2xl sm:text-3xl md:text-4xl font-medium leading-snug break-words my-auto py-4"
              >
                “{{ activeQuestion.content }}”
              </blockquote>

              <div class="flex items-center justify-between pt-6 mt-4 border-t border-current/10">
                <span class="text-xs opacity-50">
                  Tip: use your USB clicker or ← / → keys to switch questions
                </span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="prevQuestion"
                    :disabled="questions.length <= 1"
                    class="px-3.5 py-1.5 rounded-md text-xs font-medium border border-current/20 hover:bg-current/5 disabled:opacity-30"
                  >
                    ◀ Prev
                  </button>
                  <button
                    type="button"
                    @click="nextQuestion"
                    :disabled="questions.length <= 1"
                    class="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#E85D4A] text-white hover:bg-[#d44d3c] disabled:opacity-30"
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="my-auto text-center space-y-3 py-8">
                <p class="text-xs uppercase tracking-widest text-[#E85D4A] font-semibold">
                  Live Q&amp;A + Reactions Open
                </p>
                <h2 class="text-2xl md:text-4xl font-semibold">
                  Scan the QR code to react &amp; ask your questions
                </h2>
                <p class="text-sm opacity-60 max-w-md mx-auto">
                  Every question and reaction sent from your phone appears on this screen in real time.
                </p>
              </div>
            </template>
          </div>

          <!-- Baromètre de la salle : Histogramme de points inspiré du moodboard GDG -->
          <div
            class="rounded-xl px-6 py-5 border"
            :class="
              isDarkStage ? 'bg-white/5 border-white/10' : 'bg-white border-[#E6E6E6]'
            "
          >
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-medium uppercase tracking-wider opacity-60">
                Room Pulse (Live Reactions)
              </span>
              <span class="text-xs opacity-60">{{ totalReactions }} total</span>
            </div>

            <div class="grid grid-cols-5 gap-4 items-end pt-2">
              <div
                v-for="item in REACTION_CATALOG"
                :key="item.key"
                class="flex flex-col items-center space-y-2"
              >
                <!-- Nuage de points façon salih.dev / GDG -->
                <div class="flex flex-wrap justify-center gap-1 min-h-[36px] max-w-[96px] content-end">
                  <span
                    v-for="n in getReactionDots(item.key)"
                    :key="n"
                    class="w-2.5 h-2.5 rounded-full transition-transform duration-200"
                    :class="item.key === 'love' || item.key === 'wow' ? 'bg-[#E85D4A]' : isDarkStage ? 'bg-white/80' : 'bg-[#161924]'"
                  ></span>
                </div>

                <div
                  class="w-full border-t pt-2 flex flex-col items-center"
                  :class="isDarkStage ? 'border-white/15' : 'border-gray-200'"
                >
                  <span class="text-2xl leading-none">{{ item.emoji }}</span>
                  <span class="text-[11px] opacity-60 mt-1">
                    {{ item.label }} ({{ reactionCounts[item.key] || 0 }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne Droite (4 cols) : QR Code géant toujours scannable depuis la salle -->
        <div
          class="lg:col-span-4 rounded-2xl p-6 md:p-8 border flex flex-col items-center text-center space-y-5"
          :class="
            isDarkStage ? 'bg-white text-[#161924] border-white/20' : 'bg-white border-[#E6E6E6] shadow-sm'
          "
        >
          <div class="p-3 bg-white rounded-xl">
            <vue-qrcode :value="joinUrl" :size="260" level="H" class="mx-auto" />
          </div>

          <div class="space-y-1.5">
            <p class="text-base font-semibold text-[#161924]">Scan to join the session</p>
            <p class="text-xs text-gray-500">React live &amp; submit your questions</p>
          </div>

          <div
            class="w-full py-2.5 px-3 rounded-md bg-[#F6F5EF] text-[#161924] font-mono text-xs truncate border border-[#E6E6E6]"
          >
            {{ displayJoinUrl }}
          </div>
        </div>
      </div>
    </main>

    <!-- Pied de scène : Raccourcis clicker + Badge viral Free -->
    <footer
      class="w-full px-6 md:px-12 py-3 border-t flex flex-wrap items-center justify-between text-xs z-20"
      :class="isDarkStage ? 'border-white/10 text-white/50' : 'border-[#E6E6E6] text-gray-500'"
    >
      <span>Shortcuts: ←/→ or Clicker (Change question) · B (Blackout) · F (Fullscreen)</span>

      <a
        v-if="!isOwnerPremium"
        href="https://qalive.ink?utm_source=stage_badge"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E85D4A]/10 text-[#E85D4A] font-medium hover:bg-[#E85D4A]/20 transition-colors"
      >
        ⚡ Powered by <strong>QALive</strong>
      </a>
      <span v-else class="opacity-60">QALive Stage</span>
    </footer>
  </div>
</template>

