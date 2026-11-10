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
const isExpanded = ref(false)

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
    if (isExpanded.value) {
      isExpanded.value = false
    } else {
      emit('close')
    }
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
  <div class="focus-modal-root">
    <!-- Expanded Stage View (Figma node 401:1333) -->
    <div
      v-if="isExpanded"
      class="fixed inset-0 z-50 bg-[#fdd9c8] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden select-none animate-fadeIn"
    >
      <!-- Vector 3 background wave (Figma node 401:1335) -->
      <svg
        preserveAspectRatio="none"
        viewBox="0 0 1361.63 860.75"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="pointer-events-none absolute inset-0 w-full h-full"
      >
        <path
          d="M1271.51 378.219C1225.08 575.206 948.735 781.984 816.365 860.75H0L12.2188 0H1361.63V137.664C1350.94 135.771 1317.95 181.233 1271.51 378.219Z"
          fill="#FDDFD0"
        />
      </svg>

      <!-- Vector 2 background wave (Figma node 401:1336) -->
      <svg
        preserveAspectRatio="none"
        viewBox="0 0 1027.01 875.482"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="pointer-events-none absolute left-0 top-0 w-[75.5%] h-full"
      >
        <path
          d="M897.734 295.493C913.821 530.129 557.313 779.917 377.048 875.482L0 862.284V0H1027.01C977.214 0.733235 881.647 60.8585 897.734 295.493Z"
          fill="#FDD9C8"
        />
      </svg>

      <!-- Vector 1 background wave (Figma node 401:1337) -->
      <svg
        preserveAspectRatio="none"
        viewBox="0 0 431.083 619.782"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="pointer-events-none absolute left-0 top-0 w-[31.7%] h-[71%]"
      >
        <path
          d="M401.964 0C533.286 191.091 188.706 492.809 0 619.782V0H401.964Z"
          fill="#FFEFE2"
        />
      </svg>

      <!-- Minimize Button (Top Right, triggers minimize back to modal) -->
      <button
        type="button"
        @click="isExpanded = false"
        aria-label="Minimize"
        title="Minimize (Esc)"
        class="absolute top-[20px] right-[20px] sm:top-[28px] sm:right-[28px] z-30 w-[32px] h-[32px] sm:w-[36px] sm:h-[36px] bg-[#fff9f6] hover:bg-white rounded-[6px] sm:rounded-[8px] shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.75 5.25V1.75H5.25M1.75 1.75L5.83333 5.83333M12.25 8.75V12.25H8.75M12.25 12.25L8.16667 8.16667"
            stroke="#3C3C3C"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <!-- Prev Floating Button
      <button
        v-if="hasPrev"
        type="button"
        @click="goPrev"
        aria-label="Previous question"
        title="Previous question (Arrow Left)"
        class="hidden md:flex absolute left-[24px] lg:left-[40px] top-1/2 -translate-y-1/2 z-20 w-[42px] h-[42px] bg-white/90 hover:bg-white text-black rounded-full shadow-md items-center justify-center transition-all hover:scale-105 cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="#232323" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      Next Floating Button
      <button
        v-if="hasNext"
        type="button"
        @click="goNext"
        aria-label="Next question"
        title="Next question (Arrow Right)"
        class="hidden md:flex absolute right-[24px] lg:right-[40px] top-1/2 -translate-y-1/2 z-20 w-[42px] h-[42px] bg-white/90 hover:bg-white text-black rounded-full shadow-md items-center justify-center transition-all hover:scale-105 cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 15L12.5 10L7.5 5" stroke="#232323" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      -->
      <!-- Question White Card (Figma node 401:1345, 401:1346) -->
      <div
        v-if="currentQuestion"
        class="relative z-10 w-full max-w-[975px] min-h-[210px] bg-white rounded-[15px] px-[24px] py-[28px] sm:px-[36px] sm:py-[32px] md:px-[45px] md:py-[38px] flex flex-col items-start gap-[19px] max-h-[80vh] overflow-y-auto"
      >
        <p class="text-[14px] font-medium leading-normal text-[#626262]">
          {{ formatAuthor(currentQuestion) }}
        </p>
        <p
          class="text-[20px] sm:text-[24px] md:text-[26px] font-medium leading-[1.4] text-black break-words w-full"
        >
          {{ currentQuestion.content }}
        </p>
      </div>

      <!-- Powered with love by qalive (Free plan only, Figma node 401:1342) -->
      <p
        v-if="!isPremium"
        class="z-10 absolute bottom-[24px] sm:bottom-[36px] right-[24px] sm:right-[42px] text-[16px] sm:text-[18px] font-medium leading-normal text-black text-right"
      >
        Powered with love by qalive
      </p>
    </div>

    <!-- Standard Modal View (Figma node 381:940) -->
    <div
      v-else
      @click.self="$emit('close')"
      class="fixed inset-0 bg-[rgba(0,0,0,0.6)] z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <!-- Modal container (Figma node 381:940, width 752px) -->
      <div
        class="bg-white rounded-[12px] w-[680px] max-w-full overflow-hidden shadow-xl flex flex-col relative my-auto"
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
        <div class="px-[20px] sm:px-[55px] pt-[44px] pb-[24px] flex flex-col items-center w-full">
          <!-- Peach Decorative Stage Container (Figma node 382:961) -->
          <div
            class="w-full max-w-[641px] rounded-[20px] bg-[#fdd9c8] overflow-hidden relative px-[24px] sm:px-[45px] pt-[75px] pb-[75px] flex flex-col items-center justify-center"
          >
            <!-- Expand Button (Figma node 401:1350) -->
            <button
              type="button"
              @click="isExpanded = true"
              aria-label="Expand question"
              title="Expand question"
              class="absolute top-[22px] right-[18px] z-20 w-[24px] h-[24px] bg-[#fff9f6] hover:bg-white rounded-[6px] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.16667 5.83333L12.25 1.75M12.25 5.25V1.75H8.75M5.83333 8.16667L1.75 12.25M1.75 8.75V12.25H5.25"
                  stroke="#3C3C3C"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

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
              class="relative z-10 w-full max-w-[546px] bg-white rounded-[15px] px-[20px] pt-[26px] pb-[32px] flex flex-col items-start space-y-[10px]"
            >
              <p class="text-[14px] font-medium leading-normal text-[#626262]">
                {{ formatAuthor(currentQuestion) }}
              </p>
              <p
                class="text-[16px] sm:text-[20px] font-medium text-black break-words w-full leading-[28px]"
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
          <div class="pt-[22px]">
            <p
              class="text-[14px] font-normal leading-normal text-[#767676] text-center max-w-[409px]"
            >
              Use the direction arrows on your keyboard or your clicker to navigate through the questions.
            </p>
          </div>
        </div>

        <!-- Footer (Figma nodes 382:978, 382:976, 381:955, 381:944) -->
        <div
          class="h-[72px] px-[16px] border-t border-[#ececec] flex items-center justify-end shrink-0"
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

          <!-- Prev / Next buttons (Figma nodes 381:955 & 381:944)
          <div class="flex items-center gap-[7px]">
            <button
              type="button"
              :disabled="!hasPrev"
              @click="goPrev"
              class="w-[50px] h-[30px] bg-[#232323] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed rounded-[4px] px-[4px] py-[3px] flex items-center justify-center text-[12px] font-normal text-white whitespace-nowrap transition-opacity cursor-pointer"
            >
              Prev
            </button>
            <button
              type="button"
              :disabled="!hasNext"
              @click="goNext"
              class="w-[50px] h-[30px] bg-[#232323] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed rounded-[4px] px-[4px] py-[3px] flex items-center justify-center text-[12px] font-normal text-white whitespace-nowrap transition-opacity cursor-pointer"
            >
              Next
            </button>
          </div> -->
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

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fadeIn {
  animation: fadeIn 0.18s ease-out;
}
</style>
