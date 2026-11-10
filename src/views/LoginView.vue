<script setup>
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { loading, errorMsg } = storeToRefs(authStore)

const termsUrl = 'https://qalive.online/terms'
const privacyUrl = 'https://qalive.online/privacy'

async function login() {
  if (loading.value) return
  await authStore.loginWithGoogle()
}
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col justify-between items-center px-4 py-8 sm:py-12 select-none">
    <!-- Spacer / Top area to balance vertical center -->
    <div class="h-4 sm:h-8" aria-hidden="true"></div>

    <!-- Center Login Box (Figma Frame 408:1368 -> Group 25 410:1554) -->
    <main class="w-full max-w-[341px] flex flex-col items-center my-auto">
      <!-- Title (Figma 410:1553) -->
      <h1 class="text-[18px] font-semibold text-[#0e0e0e] text-center mb-[32px] tracking-tight">
        Welcome back on qalive
      </h1>

      <!-- Google Sign In Button (Figma 408:1514) -->
      <button
        type="button"
        @click="login"
        :disabled="loading"
        class="w-[341px] max-w-full h-[36px] px-[8px] py-[4px] rounded-[6px] border border-black border-solid bg-white hover:bg-[#f9f9f9] active:bg-[#f2f2f2] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      >
        <!-- Google Icon (Figma 409:1550) -->
        <svg
          v-if="!loading"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="shrink-0"
        >
          <path
            d="M15.2119 7.76693H8.96664V10.3552H12.5606C12.2261 11.9999 10.8259 12.9449 8.96664 12.9449C8.44639 12.9458 7.93109 12.844 7.45028 12.6453C6.96947 12.4466 6.53262 12.1549 6.16478 11.787C5.79695 11.4191 5.50536 10.9822 5.30675 10.5014C5.10814 10.0205 5.00641 9.50518 5.00739 8.98493C5.0065 8.46474 5.10831 7.9495 5.30696 7.46874C5.50562 6.98798 5.79722 6.55116 6.16505 6.18334C6.53288 5.81551 6.96969 5.52391 7.45045 5.32525C7.93121 5.12659 8.44646 5.02479 8.96664 5.02568C9.91089 5.02568 10.7644 5.36093 11.4341 5.90918L13.3841 3.95993C12.1961 2.92418 10.6729 2.28518 8.96664 2.28518C8.08606 2.28281 7.21368 2.4545 6.39967 2.79039C5.58565 3.12628 4.84605 3.61974 4.22338 4.24242C3.60071 4.86509 3.10724 5.60469 2.77135 6.4187C2.43546 7.23272 2.26377 8.10509 2.26614 8.98568C2.26347 9.86635 2.43496 10.7389 2.77074 11.553C3.10653 12.3672 3.59998 13.1069 4.22271 13.7296C4.84544 14.3523 5.58517 14.8458 6.39931 15.1816C7.21346 15.5174 8.08597 15.6889 8.96664 15.6862C12.3169 15.6862 15.3634 13.2494 15.3634 8.98568C15.3634 8.58968 15.3026 8.16293 15.2119 7.76693Z"
            fill="#0D0D0D"
          />
        </svg>

        <!-- Loading spinner -->
        <svg
          v-else
          class="animate-spin h-4 w-4 text-black"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>

        <span class="text-[14px] font-normal text-black whitespace-nowrap">
          {{ loading ? 'Signing in...' : 'Sign in with Google' }}
        </span>
      </button>

      <!-- Terms & Privacy (Figma 409:1517) -->
      <p class="text-[14px] font-normal text-[#757575] text-center mt-[25px] leading-[1.35] w-[341px] max-w-full">
        By signing in, you understand and agree to our
        <a
          :href="termsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-black font-medium underline underline-offset-2 hover:opacity-75 transition-opacity"
        >Terms of Service</a>
        and
        <a
          :href="privacyUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-black font-medium underline underline-offset-2 hover:opacity-75 transition-opacity"
        >Privacy Policy</a>
      </p>

      <!-- Error message display if OAuth fails -->
      <p v-if="errorMsg" class="text-center text-red-500 text-[13px] mt-4 max-w-[341px]">
        {{ errorMsg }}
      </p>
    </main>

    <!-- Bottom Social Proof Section (Figma Frame 52 / 409:1548 & 409:1549) -->
    <footer class="w-full flex flex-col items-center pt-8 pb-4 sm:pb-6">
      <!-- Tagline (Figma 409:1549) -->
      <p class="text-[14px] font-normal text-[#5c5c5c] text-center mb-[33px]">
        Join 1000+ organism hosting events with qalive
      </p>

      <!-- Organisms / Client Logos (Figma Frame 52 / 409:1548) -->
      <div class="flex items-center justify-center gap-[28px] sm:gap-[41px] flex-wrap max-w-[620px] px-4">
        <!-- Agencia Montes (image 14) -->
        <img
          src="/images/social-proof/logo-1.png"
          alt="Agencia Montes"
          class="h-[40px] sm:h-[47.4px] w-auto object-contain pointer-events-none select-none"
        />

        <!-- Sacré Willy (image 15) -->
        <img
          src="/images/social-proof/logo-2.png"
          alt="Sacré Willy"
          class="h-[34px] sm:h-[41px] w-auto object-contain pointer-events-none select-none"
        />

        <!-- Mouvement des Entreprises de France (image 16) -->
        <img
          src="/images/social-proof/logo-3.png"
          alt="Mouvement des Entreprises de France Haute-Savoie"
          class="h-[42px] sm:h-[51.4px] w-auto object-contain pointer-events-none select-none"
        />

        <!-- Barker (image 17) -->
        <img
          src="/images/social-proof/logo-4.png"
          alt="Barker"
          class="h-[16px] sm:h-[18px] w-auto object-contain pointer-events-none select-none"
        />

        <!-- Think:able (image 18) -->
        <img
          src="/images/social-proof/logo-5.png"
          alt="Think:able"
          class="h-[18px] sm:h-[21px] w-auto object-contain pointer-events-none select-none"
        />
      </div>
    </footer>
  </div>
</template>
