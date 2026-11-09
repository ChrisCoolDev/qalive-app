<script setup>
import { computed, ref } from 'vue'
import VueQrcode from 'qrcode.vue'

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
})

defineEmits(['close'])

const qrContainerRef = ref(null)
const copied = ref(false)

const sessionQuestionUrl = computed(() => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.qalive.online'
  return `${origin}/ask/${props.session?.slug || ''}`
})

const accessCode = computed(() => {
  const raw = props.session?.access_code ?? props.session?.accessCode
  if (raw === null || raw === undefined) return ''
  const trimmed = String(raw).trim()
  if (!trimmed || trimmed.toLowerCase() === 'null') return ''
  return trimmed
})

async function copyValue(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch (err) {
    console.error('Copy failed:', err)
  }
}

function downloadQrCode() {
  const canvas = qrContainerRef.value?.querySelector('canvas')
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${props.session?.slug || 'session'}-qrcode.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div
    class="bg-white rounded-[12px] w-[467px] max-w-full px-[16px] pt-[16px] pb-[16px] shadow-xl relative flex flex-col"
  >
    <!-- Header (Figma node 372:800) -->
    <div class="flex items-center justify-between w-full">
      <h2 class="text-[16px] font-medium leading-normal text-black">
        Share the session
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

    <!-- Description (Figma node 372:804) -->
    <p class="mt-[18px] text-[14px] font-normal leading-normal text-[#525151]">
      Let your audience scan this QR code to join the session and submit their questions in real time.
    </p>

    <!-- QR Code 350x350 (Figma node 372:813) -->
    <div ref="qrContainerRef" class="mt-[20px] flex items-center justify-center w-full">
      <div class="w-[350px] h-[350px] max-w-full flex items-center justify-center">
        <vue-qrcode
          :value="sessionQuestionUrl"
          :size="350"
          :level="'H'"
          render-as="canvas"
          class="max-w-full h-auto"
        />
      </div>
    </div>

    <!-- Access code row (Figma node 376:812 & 376:814) -->
    <div v-if="accessCode" class="mt-[20px] flex items-center gap-[8px] flex-wrap">
      <p class="text-[14px] font-normal leading-normal text-[#525151]">
        <span>The access code for this session is : </span>
        <span class="font-semibold text-[#262523]">{{ accessCode }}</span>
      </p>
      <button
        type="button"
        @click="copyValue(accessCode)"
        class="inline-flex items-center gap-1 hover:opacity-75 transition-opacity"
        title="Copy access code"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="shrink-0"
        >
          <path
            d="M2.91667 8.75C2.373 8.75 2.10117 8.75 1.88708 8.66133C1.74544 8.6027 1.61674 8.51673 1.50834 8.40833C1.39994 8.29993 1.31397 8.17123 1.25533 8.02958C1.16667 7.8155 1.16667 7.54367 1.16667 7V3.03333C1.16667 2.38 1.16667 2.05333 1.29383 1.80367C1.40568 1.58415 1.58415 1.40568 1.80367 1.29383C2.05333 1.16667 2.38 1.16667 3.03333 1.16667H7C7.54367 1.16667 7.8155 1.16667 8.02958 1.25533C8.17123 1.31397 8.29993 1.39994 8.40833 1.50834C8.51673 1.61674 8.6027 1.74544 8.66133 1.88708C8.75 2.10117 8.75 2.373 8.75 2.91667M7.11667 12.8333H10.9667C11.62 12.8333 11.9467 12.8333 12.1963 12.7062C12.4158 12.5943 12.5943 12.4158 12.7062 12.1963C12.8333 11.9467 12.8333 11.62 12.8333 10.9667V7.11667C12.8333 6.46333 12.8333 6.13667 12.7062 5.887C12.5943 5.66749 12.4158 5.48902 5.37717 5.887C5.25 6.13667 5.25 6.46333 5.25 7.11667V10.9667C5.25 11.62 5.25 11.9467 5.37717 12.1963C5.48902 12.4158 5.66749 12.5943 5.887 12.7062C6.13667 12.8333 6.46333 12.8333 7.11667 12.8333Z"
            stroke="#666666"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span v-if="copied" class="text-[11px] font-medium text-[#42a823]">Copied!</span>
      </button>
    </div>

    <!-- Public session link fallback row -->
    <div v-else class="mt-[20px] flex items-center gap-[8px] flex-wrap">
      <p class="text-[14px] font-normal leading-normal text-[#525151] truncate max-w-[400px]">
        <span>Public session link : </span>
        <span class="font-semibold text-[#262523]">{{ sessionQuestionUrl }}</span>
      </p>
      <button
        type="button"
        @click="copyValue(sessionQuestionUrl)"
        class="inline-flex items-center gap-1 hover:opacity-75 transition-opacity"
        title="Copy session link"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="shrink-0"
        >
          <path
            d="M2.91667 8.75C2.373 8.75 2.10117 8.75 1.88708 8.66133C1.74544 8.6027 1.61674 8.51673 1.50834 8.40833C1.39994 8.29993 1.31397 8.17123 1.25533 8.02958C1.16667 7.8155 1.16667 7.54367 1.16667 7V3.03333C1.16667 2.38 1.16667 2.05333 1.29383 1.80367C1.40568 1.58415 1.58415 1.40568 1.80367 1.29383C2.05333 1.16667 2.38 1.16667 3.03333 1.16667H7C7.54367 1.16667 7.8155 1.16667 8.02958 1.25533C8.17123 1.31397 8.29993 1.39994 8.40833 1.50834C8.51673 1.61674 8.6027 1.74544 8.66133 1.88708C8.75 2.10117 8.75 2.373 8.75 2.91667M7.11667 12.8333H10.9667C11.62 12.8333 11.9467 12.8333 12.1963 12.7062C12.4158 12.5943 12.5943 12.4158 12.7062 12.1963C12.8333 11.9467 12.8333 11.62 12.8333 10.9667V7.11667C12.8333 6.46333 12.8333 6.13667 12.7062 5.887C12.5943 5.66749 12.4158 5.48902 12.1963 5.37717C11.9467 5.25 11.62 5.25 10.9667 5.25H7.11667C6.46333 5.25 6.13667 5.25 5.887 5.37717C5.66749 5.48902 5.48902 5.66749 5.37717 5.887C5.25 6.13667 5.25 6.46333 5.25 7.11667V10.9667C5.25 11.62 5.25 11.9467 5.37717 12.1963C5.48902 12.4158 5.66749 12.5943 5.887 12.7062C6.13667 12.8333 6.46333 12.8333 7.11667 12.8333Z"
            stroke="#666666"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span v-if="copied" class="text-[11px] font-medium text-[#42a823]">Copied!</span>
      </button>
    </div>

    <!-- Download button h-[38px] (Figma node 372:811) -->
    <button
      type="button"
      @click="downloadQrCode"
      class="mt-[18px] w-full h-[38px] bg-[#E85D4A] hover:bg-[#d44d3c] rounded-[6px] px-[8px] py-[6px] flex items-center justify-center text-[14px] font-normal text-white whitespace-nowrap transition-colors"
    >
      Download the qr-code
    </button>
  </div>
</template>

