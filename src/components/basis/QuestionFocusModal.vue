<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
  initialQuestion: {
    type: Object,
    required: true,
  },
  session: {
    type: Object,
    default: null,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const currentId = ref(props.initialQuestion?.id)

// Cursor-following "Coming soon" tooltip for "Ask for public feeling"
const tooltipVisible = ref(false)
const tooltipPos = ref({ x: 0, y: 0 })

function onFeelingEnter(event) {
  tooltipVisible.value = true
  tooltipPos.value = { x: event.clientX, y: event.clientY }
}

function onFeelingMove(event) {
  tooltipPos.value = { x: event.clientX, y: event.clientY }
}

function onFeelingLeave() {
  tooltipVisible.value = false
}

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

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value + 1 < props.questions.length)

const formattedSessionName = computed(() => {
  const raw = props.session?.name ? String(props.session.name).trim() : ''
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1)
})

function formatAuthor(question) {
  const raw = question?.author_name || question?.authorName
  return raw && String(raw).trim().length > 0 ? String(raw).trim() : 'Anonym'
}

function goNext() {
  if (hasNext.value) {
    const next = props.questions[currentIndex.value + 1]
    if (next) currentId.value = next.id
  }
}

function goPrev() {
  if (hasPrev.value) {
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
    class="fixed inset-0 bg-[rgba(0,0,0,0.6)] z-50 flex items-center justify-center p-4 overflow-y-auto"
  >
    <!-- Modal container (Figma node 381:940, width 752px) -->
    <div
      class="bg-white rounded-[12px] w-[752px] max-w-full overflow-hidden shadow-xl flex flex-col relative my-auto"
    >
      <!-- Header (height 47px, Figma nodes 381:943, 381:941, 381:953) -->
      <div class="h-[47px] px-[16px] flex items-center justify-between border-b border-[#ececec] shrink-0">
        <h2 class="text-[16px] font-medium leading-normal text-black">
          Session’s activity
        </h2>
        <button
          type="button"
          @click="$emit('close')"
          aria-label="Close modal"
          class="w-[18px] h-[18px] flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 4.5L9 9M9 9L4.5 13.5M9 9L4.5 4.5M9 9L13.5 13.5"
              stroke="#666666"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-[20px] sm:px-[55px] pt-[44px] pb-[39px] flex flex-col items-center w-full">
        <!-- Peach Decorative Stage Container (Figma node 382:961) -->
        <div
          class="w-full max-w-[641px] rounded-[20px] bg-[#fdd9c8] overflow-hidden relative px-[24px] sm:px-[45px] pt-[100px] pb-[99px] flex flex-col items-center justify-center"
        >
          <!-- Vector 3 background wave (Figma node 382:962) -->
          <svg
            preserveAspectRatio="none"
            viewBox="0 0 647 409"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="pointer-events-none absolute inset-0 w-full h-full"
          >
            <path
              d="M604.181 179.717C582.119 273.319 450.807 371.573 387.91 409H0L5.80594 0H647V65.4132C641.92 64.5141 626.244 86.1161 604.181 179.717Z"
              fill="#FDDFD0"
            />
          </svg>

          <!-- Vector 2 background wave (Figma node 382:960) -->
          <svg
            preserveAspectRatio="none"
            viewBox="0 0 488 416"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="pointer-events-none absolute left-0 top-0 w-[76.1%] h-full"
          >
            <path
              d="M426.573 140.409C434.218 251.899 264.817 370.591 179.161 416L0 409.729V0H488C464.339 0.348409 418.929 28.9179 426.573 140.409Z"
              fill="#FDD9C8"
            />
          </svg>

          <!-- Vector 1 background wave (Figma node 381:958) -->
          <svg
            preserveAspectRatio="none"
            viewBox="0 0 204.836 294.5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="pointer-events-none absolute left-0 top-0 w-[31.95%] h-[72%]"
          >
            <path
              d="M191 0C253.4 90.8 89.6667 234.167 0 294.5V0H191Z"
              fill="#FFEFE2"
            />
          </svg>

          <!-- Question White Card (Figma node 382:966 / 382:963)
               Dynamic height depending on question length, exact paddings:
               px-[20px] pt-[26px] pb-[32px], gap mt-[19px] -->
          <div
            v-if="currentQuestion"
            class="relative z-10 w-full max-w-[546px] bg-white rounded-[15px] px-[20px] pt-[26px] pb-[32px] flex flex-col items-start"
          >
            <p class="text-[14px] font-medium leading-normal text-[#626262]">
              {{ formatAuthor(currentQuestion) }}
            </p>
            <p
              class="mt-[19px] text-[20px] sm:text-[24px] font-medium leading-normal text-black break-words w-full"
            >
              {{ currentQuestion.content }}
            </p>
          </div>

          <!-- Powered with love by qalive (Free plan only, Figma node 382:977) -->
          <p
            v-if="!isPremium"
            class="z-10 absolute bottom-[17px] right-[21px] text-[14px] font-medium leading-normal text-black text-right"
          >
            Powered with love by qalive
          </p>
        </div>

        <!-- Session Title & Subtitle (Figma nodes 382:967 & 382:968) -->
        <p
          v-if="formattedSessionName"
          class="mt-[44px] text-[16px] font-semibold leading-normal text-black text-center first-letter:uppercase"
        >
          {{ formattedSessionName }}
        </p>
        <p
          class="mt-[8px] text-[14px] font-normal leading-normal text-black text-center max-w-[409px]"
        >
          Your question will be display here by the monitorer. You can attach your identity with your question or stay anonym.
        </p>
      </div>

      <!-- Footer (Figma nodes 382:978, 382:976, 381:955, 381:944) -->
      <div
        class="h-[72px] px-[16px] border-t border-[#ececec] flex items-center justify-between shrink-0"
      >
        <!-- Ask for public feeling (disabled + cursor tooltip "Coming soon") -->
        <div
          @mouseenter="onFeelingEnter"
          @mousemove="onFeelingMove"
          @mouseleave="onFeelingLeave"
          class="inline-flex items-start gap-[6px] cursor-not-allowed select-none"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="shrink-0"
          >
            <path
              d="M6 10.5C6 10.5 7.125 12 9 12C10.875 12 12 10.5 12 10.5M11.25 6.75H11.2575M6.75 6.75H6.7575M16.5 9C16.5 13.1423 13.1423 16.5 9 16.5C4.85775 16.5 1.5 13.1423 1.5 9C1.5 4.85775 4.85775 1.5 9 1.5C13.1423 1.5 16.5 4.85775 16.5 9ZM11.625 6.75C11.625 6.84946 11.5855 6.94484 11.5152 7.01517C11.4448 7.08549 11.3495 7.125 11.25 7.125C11.1505 7.125 11.0552 7.08549 10.9848 7.01517C10.9145 6.94484 10.875 6.84946 10.875 6.75C10.875 6.65054 10.9145 6.55516 10.9848 6.48483C11.0552 6.41451 11.1505 6.375 11.25 6.375C11.3495 6.375 11.4448 6.41451 11.5152 6.48483C11.5855 6.55516 11.625 6.65054 11.625 6.75ZM7.125 6.75C7.125 6.84946 7.08549 6.94484 7.01517 7.01517C6.94484 7.08549 6.84946 7.125 6.75 7.125C6.65054 7.125 6.55516 7.08549 6.48483 7.01517C6.41451 6.94484 6.375 6.84946 6.375 6.75C6.375 6.65054 6.41451 6.55516 6.48483 6.48483C6.55516 6.41451 6.65054 6.375 6.75 6.375C6.84946 6.375 6.94484 6.41451 7.01517 6.48483C7.08549 6.55516 7.125 6.65054 7.125 6.75Z"
              stroke="#626262"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-[14px] font-medium leading-normal text-[#626262] underline whitespace-nowrap">
            Ask for public feeling
          </span>
        </div>

        <!-- Prev / Next buttons (Figma nodes 381:955 & 381:944) -->
        <div class="flex items-center gap-[10px]">
          <button
            type="button"
            :disabled="!hasPrev"
            @click="goPrev"
            class="w-[67px] h-[38px] bg-[#232323] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed rounded-[6px] px-[8px] py-[6px] flex items-center justify-center text-[14px] font-normal text-white whitespace-nowrap transition-opacity"
          >
            Prev
          </button>
          <button
            type="button"
            :disabled="!hasNext"
            @click="goNext"
            class="w-[67px] h-[38px] bg-[#232323] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed rounded-[6px] px-[8px] py-[6px] flex items-center justify-center text-[14px] font-normal text-white whitespace-nowrap transition-opacity"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Floating cursor tooltip "Coming soon" -->
    <Teleport to="body">
      <div
        v-if="tooltipVisible"
        :style="{ left: `${tooltipPos.x + 12}px`, top: `${tooltipPos.y + 12}px` }"
        class="fixed z-[100] pointer-events-none bg-black text-white text-[11px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap"
      >
        Coming soon
      </div>
    </Teleport>
  </div>
</template>
