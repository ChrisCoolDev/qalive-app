<script setup>
import { useSessionStore } from "@/stores/sessionStore";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";

const sessionStore = useSessionStore();
const {
  sessionName,
  accessCode,
  customDuration,
  showModal,
  loading,
  isPremium,
  sessionLogoFile,
} = storeToRefs(sessionStore);

const { createSession, redirectToSessionQrCode } = sessionStore;

// Preview de l'image locale
const previewUrl = ref(null);

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  sessionLogoFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
};

// Reset preview quand on ferme le modal
watch(showModal, (val) => {
  if (!val) previewUrl.value = null;
});

const handleCreateSession = async () => {
  const success = await createSession();
  if (success) {
    redirectToSessionQrCode();
  }
};

const buttonText = computed(() => {
  if (loading.value) return "Creating...";
  return isPremium.value ? "Create Pro Session" : "Create Session";
});
</script>

<template>
  <form
    @submit.prevent="handleCreateSession"
    class="space-y-5 bg-white rounded-[6px] px-6 py-8 max-w-[380px] w-full relative border border-gray-100 shadow-xl"
  >
    <div
      @click="showModal = false"
      class="absolute top-3 right-5 text-3xl font-light text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
    >
      <span class="material-symbols-outlined"> close_small </span>
    </div>

    <div class="mb-2">
      <h2 class="text-lg font-medium text-primary">Create a new session</h2>
      <p class="text-[12px] text-gray-400">Setup your event interaction in seconds.</p>
    </div>

    <div>
      <label class="block text-[13px] text-gray-500 mb-1">Session name</label>
      <input
        v-model="sessionName"
        type="text"
        required
        placeholder="e.g. Town Hall Q1"
        class="w-full p-2.5 border border-gray-200 rounded-[4px] outline-none text-sm focus:border-[#E85D4A]"
        :disabled="loading"
      />
    </div>

    <div>
      <label class="block text-[13px] text-gray-500 mb-1">Access code (optional)</label>
      <input
        v-model="accessCode"
        type="text"
        placeholder="Leave empty for public"
        class="w-full p-2.5 border border-gray-200 rounded-[4px] outline-none text-sm focus:border-[#E85D4A]"
        :disabled="loading"
      />
    </div>

    <hr class="border-gray-100" />

    <div class="space-y-4">
      <div :class="{ 'opacity-60': !isPremium }">
        <label class="flex items-center justify-between text-[13px] text-gray-500 mb-1">
          <span>Duration (hours)</span>
          <span
            v-if="!isPremium"
            class="text-[10px] font-bold text-[#E85D4A] bg-red-50 px-1.5 py-0.5 rounded"
            >PRO</span
          >
        </label>
        <div class="relative">
          <input
            v-model="customDuration"
            type="number"
            min="1"
            max="72"
            :disabled="!isPremium || loading"
            class="w-full p-2.5 border border-gray-200 rounded-[4px] outline-none text-sm focus:border-[#E85D4A] disabled:bg-gray-50"
          />
          <span
            v-if="!isPremium"
            class="absolute right-3 top-2.5 text-xs text-gray-400 italic"
            >Forced 2h</span
          >
        </div>
      </div>

      <div :class="{ 'opacity-60 grayscale': !isPremium }">
        <label class="flex items-center justify-between text-[13px] text-gray-500 mb-1">
          <span>Custom Brand Logo</span>
          <span
            v-if="!isPremium"
            class="text-[10px] font-bold text-[#E85D4A] bg-red-50 px-1.5 py-0.5 rounded"
            >PRO</span
          >
        </label>

        <div class="relative w-full">
          <input
            v-if="isPremium"
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            :disabled="loading"
          />

          <div
            class="w-full p-3 border border-dashed border-gray-300 rounded-[4px] flex items-center justify-center bg-gray-50 min-h-[80px]"
          >
            <div v-if="previewUrl && isPremium" class="flex flex-col items-center">
              <img
                :src="previewUrl"
                class="h-12 w-12 object-cover rounded-full border border-gray-200 shadow-sm"
              />
              <p class="text-[10px] text-gray-500 mt-1">Tap to change</p>
            </div>
            <div v-else class="text-center">
              <span class="material-symbols-outlined text-gray-400 text-[24px]">
                add_photo_alternate
              </span>
              <p class="text-[11px] text-gray-400 mt-1">
                {{ isPremium ? "Click to upload logo" : "Upgrade to upload logo" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="!isPremium"
      class="text-[11px] text-gray-400 leading-relaxed bg-gray-50 p-2 rounded"
    >
      Free sessions are limited to <strong>2 hours</strong> and
      <strong>70 questions</strong>.
    </p>

    <button
      type="submit"
      class="w-full py-3 px-4 bg-[#E85D4A] hover:bg-[#d44d3c] transition-colors text-white rounded font-medium text-[13px] shadow-sm disabled:opacity-50"
      :disabled="loading"
    >
      {{ buttonText }}
    </button>
  </form>
</template>
