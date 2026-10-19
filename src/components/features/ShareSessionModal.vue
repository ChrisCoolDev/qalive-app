<script setup lang="ts">
import { computed, ref } from "vue";
import QrcodeVue from "qrcode.vue";
import type { Session } from "@/types";

const props = defineProps<{
  session: Session;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const QR_SIZE = 350;

const qrWrapperRef = ref<HTMLDivElement | null>(null);
const copied = ref(false);

const accessCode = computed(() => props.session.accessCode ?? props.session.access_code ?? null);

const sessionUrl = computed(() =>
  props.session.slug ? `${window.location.origin}/ask/${props.session.slug}` : window.location.origin,
);

const copyAccessCode = async () => {
  if (!accessCode.value) return;
  try {
    await navigator.clipboard.writeText(accessCode.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // Clipboard not available (e.g. insecure context) – silently ignore
  }
};

const downloadQrCode = () => {
  const canvas = qrWrapperRef.value?.querySelector("canvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${props.session.slug || "session"}-qrcode.png`;
  link.click();
};
</script>

<template>
  <div class="font-inter bg-white rounded-[12px] w-[467px] max-w-full relative overflow-hidden px-4 pt-[18px] pb-4">
    <!-- Close -->
    <button
      id="close-share-session"
      type="button"
      @click="emit('close')"
      aria-label="Close"
      class="absolute right-4 top-4 size-[18px] hover:opacity-70 transition-opacity"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <!-- Header -->
    <h2 class="text-[16px] font-medium leading-[normal] text-black pr-8">Share the session</h2>

    <p class="mt-6 text-[14px] leading-[normal] text-[#525151]">
      Let your audience join <span class="text-[#262523] font-medium">{{ session.name }}</span> by scanning
      the QR code below, or share the link with them directly. They will be able to ask questions live
      during the session.
    </p>

    <!-- QR code -->
    <div ref="qrWrapperRef" class="mt-[27px] flex justify-center">
      <QrcodeVue
        :value="sessionUrl"
        :size="QR_SIZE"
        :margin="0"
        level="M"
        render-as="canvas"
        background="#ffffff"
        foreground="#000000"
        class="size-[350px]"
      />
    </div>

    <!-- Access code -->
    <div class="mt-[18px] flex items-center gap-2 text-[14px] leading-[normal] text-[#525151]">
      <template v-if="accessCode">
        <p>
          The access code for this session is :
          <span class="font-semibold text-[#262523]">{{ accessCode }}</span>
        </p>
        <button
          id="copy-access-code"
          type="button"
          @click="copyAccessCode"
          :aria-label="copied ? 'Copied' : 'Copy access code'"
          :title="copied ? 'Copied!' : 'Copy'"
          class="size-[14px] shrink-0 hover:opacity-70 transition-opacity"
        >
          <svg v-if="!copied" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.91667 8.75C2.373 8.75 2.10117 8.75 1.88708 8.66133C1.74544 8.6027 1.61674 8.51673 1.50834 8.40833C1.39994 8.29993 1.31397 8.17123 1.25533 8.02958C1.16667 7.8155 1.16667 7.54367 1.16667 7V3.03333C1.16667 2.38 1.16667 2.05333 1.29383 1.80367C1.40568 1.58415 1.58415 1.40568 1.80367 1.29383C2.05333 1.16667 2.38 1.16667 3.03333 1.16667H7C7.54367 1.16667 7.8155 1.16667 8.02958 1.25533C8.17123 1.31397 8.29993 1.39994 8.40833 1.50834C8.51673 1.61674 8.6027 1.74544 8.66133 1.88708C8.75 2.10117 8.75 2.373 8.75 2.91667M7.11667 12.8333H10.9667C11.62 12.8333 11.9467 12.8333 12.1963 12.7062C12.4158 12.5943 12.5943 12.4158 12.7062 12.1963C12.8333 11.9467 12.8333 11.62 12.8333 10.9667V7.11667C12.8333 6.46333 12.8333 6.13667 12.7062 5.887C12.5943 5.66749 12.4158 5.48902 12.1963 5.37717C11.9467 5.25 11.62 5.25 10.9667 5.25H7.11667C6.46333 5.25 6.13667 5.25 5.887 5.37717C5.66749 5.48902 5.48902 5.66749 5.37717 5.887C5.25 6.13667 5.25 6.46333 5.25 7.11667V10.9667C5.25 11.62 5.25 11.9467 5.37717 12.1963C5.48902 12.4158 5.66749 12.5943 5.887 12.7062C6.13667 12.8333 6.46333 12.8333 7.11667 12.8333Z" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="#D4382A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </template>
      <p v-else>This session is public, no access code is required.</p>
    </div>

    <!-- Download -->
    <button
      id="download-qr-code"
      type="button"
      @click="downloadQrCode"
      class="mt-6 w-full flex items-center justify-center px-2 py-[10px] rounded-[6px] bg-[#d4382a] text-[14px] leading-[normal] text-white hover:bg-[#bf3123] transition-colors"
    >
      Download the qr-code
    </button>
  </div>
</template>
