<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { parseUTCDate } from '@/utils/dateHelper'

const props = defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
  initialQuestion: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close'])

const currentId = ref(props.initialQuestion?.id)

watch(
  () => props.initialQuestion,
  (newQ) => {
    if (newQ?.id) {
      currentId.value = newQ.id
    }
  },
)

const currentIndex = computed(() => {
  const idx = props.questions.findIndex((q) => q.id === currentId.value)
  return idx >= 0 ? idx : 0
})

const currentQuestion = computed(() => {
  return props.questions[currentIndex.value] || props.initialQuestion
})

const nextQuestion = computed(() => {
  const nextIdx = currentIndex.value + 1
  if (nextIdx < props.questions.length) {
    return props.questions[nextIdx]
  }
  return null
})

function formatAuthor(question) {
  const raw = question?.author_name || question?.authorName
  return raw && String(raw).trim().length > 0 ? String(raw).trim() : 'Anonymous'
}

function formatRelativeTime(question) {
  const created = parseUTCDate(question?.created_at || question?.createdAt)
  if (!created) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000))
  if (diffSec < 60) return "à l'instant"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `il y’a ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `il y’a ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  return `il y’a ${diffDays} j`
}

function goNext() {
  if (nextQuestion.value) {
    currentId.value = nextQuestion.value.id
  }
}

function goPrev() {
  if (currentIndex.value > 0) {
    const prev = props.questions[currentIndex.value - 1]
    if (prev) currentId.value = prev.id
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    emit('close')
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault()
    goNext()
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault()
    goPrev()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    @click.self="$emit('close')"
    class="fixed inset-0 bg-[rgba(0,0,0,0.6)] z-50 flex flex-col items-center justify-center px-4 overflow-hidden"
  >
    <div
      @click.self="$emit('close')"
      class="w-full max-w-[891px] flex flex-col items-center justify-center"
    >
      <!-- Active Question Card (Figma node 116:1235) -->
      <div
        v-if="currentQuestion"
        class="w-full min-h-[237px] bg-white rounded-[16px] px-[24px] sm:px-[44px] py-[28px] sm:py-[36px] flex flex-col justify-between shadow-xl relative"
      >
        <div>
          <p class="text-[16px] font-medium leading-normal text-black">
            {{ formatAuthor(currentQuestion) }}
          </p>
          <p
            class="mt-[16px] text-[18px] sm:text-[22px] font-normal leading-normal text-[#525151] break-words"
          >
            {{ currentQuestion.content }}
          </p>
        </div>

        <p class="mt-[24px] text-[14px] font-normal leading-normal text-[#aaa]">
          {{ formatRelativeTime(currentQuestion) }}
        </p>
      </div>

      <!-- Next Question Peek Card (Figma node 116:1236 & fade 116:1241) -->
      <div
        v-if="nextQuestion"
        @click="goNext"
        class="mt-[14px] w-full h-[132px] bg-white rounded-t-[16px] rounded-b-[16px] px-[24px] sm:px-[44px] pt-[28px] sm:pt-[36px] overflow-hidden relative cursor-pointer transition-transform hover:-translate-y-0.5"
      >
        <p class="text-[16px] font-medium leading-normal text-black">
          {{ formatAuthor(nextQuestion) }}
        </p>
        <p
          class="mt-[16px] text-[18px] sm:text-[22px] font-normal leading-normal text-[#525151] break-words line-clamp-2"
        >
          {{ nextQuestion.content }}
        </p>

        <!-- Fade gradient at bottom (Figma node 116:1241) -->
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 h-[76px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(255,255,255,0.88)]"
        ></div>
      </div>
    </div>
  </div>
</template>

