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
    <div
      class="min-h-screen flex justify-center items-center text-center px-4 py-8 md:px-6 lg:px-8"
    >
      <div v-if="loading" class="text-sm text-gray-500">Loading...</div>

      <div
        v-else-if="session"
        class="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl gap-8 lg:gap-12"
      >
        <div class="w-full lg:w-auto order-2 lg:order-1 max-sm:mt-12">
          <div class="space-y-3 mb-0 lg:mb-0">
            <h1 class="text-2xl sm:text-3xl font-bold">Scan QR code</h1>
            <p
              class="text-sm sm:text-base text-gray-500 max-w-xs mx-auto lg:mx-0 leading-[130%] pb-[40px]"
            >
              Scan this QR code to ask your questions during the event
            </p>
          </div>
          <div
            class="flex flex-col items-center lg:items-start justify-center space-y-6 w-full"
          >
            <div
              v-if="session.expires_at"
              class="flex items-center space-x-2 w-full max-w-[303px]"
            >
              <div class="h-0 flex-1 border-b border-b-gray-200 border-b-solid"></div>
              <p
                class="text-gray-500 text-xs sm:text-sm leading-[100%] whitespace-nowrap px-2"
              >
                Or go on this link
              </p>
              <div class="h-0 flex-1 border-b border-b-gray-200 border-b-solid"></div>
            </div>
            <p
              class="pl-4 pr-2 truncate w-full max-w-[303px] font-semibold text-tertiary py-3 border border-solid boder-gray-300 rounded-[4px] text-[13px] text-left"
            >
              {{ sessionQuestionUrl }}
            </p>
            <div class="flex flex-col items-center space-y-5 w-full">
              <button
                @click="redirectToQuestionsPage"
                class="flex items-center justify-center py-[11px] bg-[#E85D4A] rounded-[4px] max-w-[303px] w-full text-white text-[13px] font-medium hover:bg-[#d54d3a] transition-colors"
              >
                See the questions
              </button>
              <button
                class="text-[13px] text-tertiary hover:underline"
                @click="redirectToOverview"
              >
                Go to back to the dashbord
              </button>
            </div>
          </div>
        </div>

        <div class="block lg:hidden order-1 w-full flex justify-center">
          <vue-qrcode
            :value="sessionQuestionUrl"
            :size="350"
            :level="'H'"
            class="rounded-xl"
          />
        </div>

        <div class="hidden lg:block order-2 w-[500px]">
          <vue-qrcode
            :value="sessionQuestionUrl"
            :size="500"
            :level="'H'"
            class="rounded-xl w-full h-auto"
          />
        </div>
      </div>

      <div v-else>Session non trouvée.</div>
    </div>
  </AppLayout>
</template>
