<script setup>
import { useSessionStore } from "@/stores/sessionStore";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

const sessionStore = useSessionStore();
const { showUpgradePlanModal, user } = storeToRefs(sessionStore);

// Ton URL Lemon Squeezy
const LEMON_SQUEEZY_CHECKOUT_URL =
  "https://qaliveapp.lemonsqueezy.com/buy/8605680b-5f27-4828-8011-af05e9aaa53f";

// Charge le script Lemon.js dynamiquement
onMounted(() => {
  if (!document.getElementById("lemon-js")) {
    const script = document.createElement("script");
    script.id = "lemon-js";
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    document.body.appendChild(script);
  }
});

const handleUpgrade = () => {
  // 1. Vérification de sécurité
  if (!user.value || !user.value.id) {
    alert("Please log in first.");
    return;
  }

  // 2. Construction MANUELLE de l'URL (pour éviter le %5B %5D)
  let finalUrl = LEMON_SQUEEZY_CHECKOUT_URL;

  // On ajoute le ? ou le & selon si l'URL de base en a déjà
  finalUrl += finalUrl.includes("?") ? "&" : "?";

  // On écrit les crochets en DUR
  finalUrl += `checkout[custom][user_id]=${user.value.id}`;

  // On ajoute l'email s'il existe
  if (user.value.email) {
    finalUrl += `&checkout[email]=${user.value.email}`;
  }

  // 3. DEBUG : Cette fois, l'URL sera propre dans la console
  console.log("🚀 URL CORRIGÉE :", finalUrl);

  // 4. Ouverture du checkout
  if (window.LemonSqueezy) {
    window.LemonSqueezy.Url.Open(finalUrl);
  } else {
    window.open(finalUrl, "_blank");
  }

  showUpgradePlanModal.value = false;
};
</script>

<template>
  <div
    class="bg-white rounded-[8px] p-8 max-w-[450px] w-full text-center relative shadow-2xl"
  >
    <div
      @click="showUpgradePlanModal = false"
      class="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600"
    >
      <span class="material-symbols-outlined">close</span>
    </div>

    <div
      class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6"
    >
      <span class="material-symbols-outlined text-[#E85D4A] text-[32px]"
        >rocket_launch</span
      >
    </div>

    <h2 class="text-2xl font-semibold text-primary mb-2">Upgrade to Pro</h2>
    <p class="text-gray-500 text-[14px] mb-8 leading-relaxed">
      You've reached the limits of the Free plan. <br />
      Unlock unlimited sessions, questions, and custom branding.
    </p>

    <ul class="text-left space-y-3 mb-8 bg-gray-50 p-5 rounded-[6px]">
      <li class="flex items-center text-[13px] text-gray-700">
        <span class="material-symbols-outlined text-green-500 text-[18px] mr-2"
          >check_circle</span
        >
        Unlimited Sessions
      </li>
      <li class="flex items-center text-[13px] text-gray-700">
        <span class="material-symbols-outlined text-green-500 text-[18px] mr-2"
          >check_circle</span
        >
        Unlimited Questions per session
      </li>
      <li class="flex items-center text-[13px] text-gray-700">
        <span class="material-symbols-outlined text-green-500 text-[18px] mr-2"
          >check_circle</span
        >
        Custom Brand Logo
      </li>
      <li class="flex items-center text-[13px] text-gray-700">
        <span class="material-symbols-outlined text-green-500 text-[18px] mr-2"
          >check_circle</span
        >
        Session duration control
      </li>
    </ul>

    <button
      @click="handleUpgrade"
      class="w-full py-3.5 bg-[#E85D4A] hover:bg-[#d44d3c] text-white font-medium rounded-[4px] shadow-lg shadow-orange-200 transition-all transform hover:-translate-y-0.5"
    >
      Subscribe for $14.99/mo
    </button>

    <p class="mt-4 text-[11px] text-gray-400">
      Secure payment via Lemon Squeezy. Cancel anytime.
    </p>
  </div>
</template>
