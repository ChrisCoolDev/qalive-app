// /views/SessionQRCode.vue
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import VueQrcode from "qrcode.vue";
import AppLayout from "@/layouts/AppLayout.vue";

const route = useRoute();
const router = useRouter();
const sessionSlug = route.params.slug;
const session = ref(null);
const loading = ref(true);

const redirectToQuestionsPage = () => {
  router.push(`/session/${sessionSlug}`);
};

const redirectToOverview = () => {
  router.push("/overview");
};

// L'URL publique pour poser les questions
const sessionQuestionUrl = computed(() =>
  sessionSlug ? `${window.location.origin}/ask/${sessionSlug}` : ""
);

onMounted(async () => {
  // Récupérer les détails de la session
  const { data, error } = await supabase
    .from("sessions")
    .select("id, name, expires_at")
    .eq("slug", sessionSlug)
    .single();

  if (data && !error) {
    session.value = data;
  }
  loading.value = false;
});
</script>

<template>
  <AppLayout>
    <div class="h-screen flex justify-center items-center text-center">
      <div v-if="loading" class="text-sm text-gray-500">Loading...</div>
      <div v-else-if="session" class="flex items-center justify-between w-full">
        <div>
          <div class="space-y-3">
            <h1 class="text-3xl font-bold">Scan QR code</h1>
            <p class="text-base text-gray-500 max-w-xs leading-[130%] pb-[40px]">
              Scan this QR code to ask your questions during the event
            </p>
          </div>
          <div class="flex flex-col items-center justify-center space-y-6 w-full">
            <div v-if="session.expires_at" class="flex items-center space-x-2">
              <div class="h-0 w-[90px] border-b border-b-gray-200 border-b-solid"></div>
              <p class="text-gray-500 text-sm leading-[100%]">Or go on this link</p>
              <div class="h-0 w-[90px] border-b border-b-gray-200 border-b-solid"></div>
            </div>
            <p
              class="pl-4 pr-2 truncate max-w-[303px] font-semibold text-tertiary py-3 border border-solid boder-gray-300 rounded-[4px] text-[13px] text-left w-full"
            >
              {{ sessionQuestionUrl }}
            </p>
            <div class="flex flex-col items-center space-y-5 w-full">
              <button
                @click="redirectToQuestionsPage"
                class="flex items-center justify-center py-[11px] bg-[#E85D4A] rounded-[4px] max-w-[303px] w-full text-white text-[13px] font-medium"
              >
                See the questions
              </button>
              <button class="text-[13px] text-tertiary" @click="redirectToOverview">
                Go to back to the dashbord
              </button>
            </div>
          </div>
        </div>
        <div class="flex justify-center">
          <vue-qrcode :value="sessionQuestionUrl" :size="500" class="rounded-xl" />
        </div>
      </div>

      <div v-else>Session non trouvée.</div>
    </div>
  </AppLayout>
</template>
