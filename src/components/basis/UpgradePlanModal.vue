<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'
import { analytics } from '@/lib/analytics'

const sessionStore = useSessionStore()
const { showUpgradePlanModal, user, isPremium } = storeToRefs(sessionStore)

// Abonnement Pro mensuel (Lemon Squeezy)
const PRO_CHECKOUT_URL =
  'https://qalive-online.lemonsqueezy.com/checkout/buy/7db8754f-a537-452c-a25c-d314ac251172'

// Event Pass (paiement unique 7 jours) : à renseigner dans .env une fois le produit créé sur Lemon Squeezy
const EVENT_PASS_CHECKOUT_URL = import.meta.env.VITE_LEMON_EVENT_PASS_CHECKOUT_URL || ''

const plans = {
  free: {
    name: 'Free',
    price: '$0',
    features: [
      '1 test session (live mode only)',
      '1 hour per session',
      'Public sessions only',
      'Up to 15 participants and 15 questions per session',
      'File sharing up to 5 MB',
    ],
  },
  pass: {
    name: 'Event Pass',
    price: '$9',
    billing: 'One-time payment, valid for 7 days',
    features: [
      'Unlimited sessions for 7 days',
      'Schedule upcoming sessions in advance',
      'Private sessions with access code',
      'Custom session duration',
      'Unlimited participants and questions per session',
      'File sharing up to 25 MB',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$9',
    billing: 'per month',
    features: ['Everything in the Event Pass, renewed every month'],
  },
}

// Info-bulle flottante "Coming soon" si le Pass n'est pas encore configuré
const tooltipVisible = ref(false)
const tooltipPos = ref({ x: 0, y: 0 })

function onPassEnter(event) {
  if (EVENT_PASS_CHECKOUT_URL) return
  tooltipVisible.value = true
  tooltipPos.value = { x: event.clientX, y: event.clientY }
}

function onPassMove(event) {
  tooltipPos.value = { x: event.clientX, y: event.clientY }
}

function onPassLeave() {
  tooltipVisible.value = false
}

onMounted(() => {
  if (!document.getElementById('lemon-js')) {
    const script = document.createElement('script')
    script.id = 'lemon-js'
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js'
    script.defer = true
    document.body.appendChild(script)
  }
})

function openCheckout(baseUrl, plan) {
  if (!baseUrl) return
  if (!user.value?.id) return alert('Please log in first.')

  analytics.trackEvent('checkout_clicked', { user_id: user.value.id, plan })

  let finalUrl = baseUrl
  finalUrl += finalUrl.includes('?') ? '&' : '?'
  finalUrl += `checkout[custom][user_id]=${encodeURIComponent(user.value.id)}`
  finalUrl += `&checkout[custom][plan]=${encodeURIComponent(plan)}`
  finalUrl += `&checkout[email]=${encodeURIComponent(user.value.email || '')}`

  window.open(finalUrl, '_blank')
  showUpgradePlanModal.value = false
}

const handleTakePass = () => openCheckout(EVENT_PASS_CHECKOUT_URL, 'event_pass_7d')
const handleUpgradePro = () => openCheckout(PRO_CHECKOUT_URL, 'pro_monthly')
</script>

<template>
  <!-- Upgrade plan modal (Figma node 389:1106) -->
  <div
    class="bg-white rounded-[12px] w-[467px] max-w-full max-h-[92vh] overflow-y-auto relative shadow-xl"
  >
    <!-- Header -->
    <div class="relative h-[47px] border-b border-[#ececec]">
      <h2 class="absolute left-4 top-[18px] text-[16px] font-medium leading-normal text-black">
        Upgrade your plan
      </h2>
      <button
        type="button"
        @click="showUpgradePlanModal = false"
        aria-label="Close"
        class="absolute right-4 top-4 w-[18px] h-[18px] flex items-center justify-center hover:opacity-70 transition-opacity"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.5 4.5L9 9M9 9L4.5 13.5M9 9L4.5 4.5M9 9L13.5 13.5"
            stroke="#666666"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div class="px-4 pt-[13px] pb-4">
      <p class="text-[14px] font-normal leading-normal text-[#666]">
        Unlock more features by choosing the plan that fits your needs.
      </p>

      <div class="mt-[25px] flex flex-col gap-[12px] w-full">
        <!-- Free plan -->
        <div
          :class="[
            'rounded-[12px] p-[10px] w-full flex flex-col gap-[6px] border',
            !isPremium ? 'bg-[#fafbf8] border-[#a2a2a2]' : 'border-[#e3e3e3]',
          ]"
        >
          <div class="flex items-center gap-[9px]">
            <p class="text-[14px] font-semibold leading-normal text-black whitespace-nowrap">
              {{ plans.free.name }} {{ plans.free.price }}
            </p>
            <span
              v-if="!isPremium"
              class="h-[22px] px-[10px] flex items-center justify-center border border-[#ddd] rounded-[10px] text-[11px] text-[#666] whitespace-nowrap"
            >
              Current plan
            </span>
          </div>
          <ul class="flex flex-col gap-[8px] w-full">
            <li
              v-for="feature in plans.free.features"
              :key="feature"
              class="flex items-start gap-[6px]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0 mt-[1px]">
                <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="text-[14px] font-normal leading-normal text-[#666]">{{ feature }}</span>
            </li>
          </ul>
        </div>

        <!-- Event Pass -->
        <div class="border border-[#e3e3e3] rounded-[12px] p-[10px] w-full flex flex-col gap-[10px]">
          <div class="flex flex-col gap-[6px] w-full">
            <div class="flex items-center gap-[9px] flex-wrap">
              <p class="text-[14px] font-semibold leading-normal text-black whitespace-nowrap">
                {{ plans.pass.name }} {{ plans.pass.price }}
              </p>
              <p class="text-[12px] font-normal leading-normal text-[#666]">
                {{ plans.pass.billing }}
              </p>
            </div>
            <ul class="flex flex-col gap-[8px] w-full">
              <li
                v-for="feature in plans.pass.features"
                :key="feature"
                class="flex items-start gap-[6px]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0 mt-[1px]">
                  <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="text-[14px] font-normal leading-normal text-[#666]">{{ feature }}</span>
              </li>
            </ul>
          </div>
          <div class="flex justify-end w-full">
            <button
              v-if="!isPremium"
              type="button"
              :disabled="!EVENT_PASS_CHECKOUT_URL"
              @click="handleTakePass"
              @mouseenter="onPassEnter"
              @mousemove="onPassMove"
              @mouseleave="onPassLeave"
              class="h-[28px] px-[10px] bg-black hover:bg-[#262523] rounded-[6px] text-[12px] font-normal text-white whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Get the pass
            </button>
          </div>
        </div>

        <!-- Pro -->
        <div
          :class="[
            'rounded-[12px] p-[10px] w-full flex flex-col gap-[10px] border',
            isPremium ? 'bg-[#fafbf8] border-[#a2a2a2]' : 'border-[#e3e3e3]',
          ]"
        >
          <div class="flex flex-col gap-[6px] w-full">
            <div class="flex items-center gap-[9px]">
              <p class="text-[14px] font-semibold leading-normal text-black whitespace-nowrap">
                {{ plans.pro.name }} {{ plans.pro.price }}
              </p>
              <p class="text-[12px] font-normal leading-normal text-[#666]">
                {{ plans.pro.billing }}
              </p>
              <span
                v-if="isPremium"
                class="h-[22px] px-[10px] flex items-center justify-center border border-[#ddd] rounded-[10px] text-[11px] text-[#666] whitespace-nowrap"
              >
                Current plan
              </span>
            </div>
            <ul class="flex flex-col gap-[8px] w-full">
              <li
                v-for="feature in plans.pro.features"
                :key="feature"
                class="flex items-start gap-[6px]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0 mt-[1px]">
                  <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="text-[14px] font-normal leading-normal text-[#666]">{{ feature }}</span>
              </li>
            </ul>
          </div>
          <div v-if="!isPremium" class="flex justify-end w-full">
            <button
              type="button"
              @click="handleUpgradePro"
              class="h-[28px] px-[10px] bg-black hover:bg-[#262523] rounded-[6px] text-[12px] font-normal text-white whitespace-nowrap transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating cursor tooltip "Coming soon" (Event Pass not configured yet) -->
    <Teleport to="body">
      <div
        v-if="tooltipVisible"
        :style="{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 12}px` }"
        class="fixed -translate-x-1/2 -translate-y-full pointer-events-none z-[100] bg-[#1b1b1b] text-white text-[11px] px-2 py-1 rounded-[4px] whitespace-nowrap shadow-md"
      >
        Coming soon
      </div>
    </Teleport>
  </div>
</template>
