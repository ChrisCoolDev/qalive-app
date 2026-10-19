<script setup lang="ts">
import { useSessionStore } from "@/stores/sessionStore";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import type { SessionType } from "@/types";
import { zonedDateTimeToUtc } from "@/utils/sessionStatus";

const sessionStore = useSessionStore();
const {
  sessionName,
  sessionDescription,
  accessCode,
  customDuration,
  showModal,
  loading,
  isPremium,
  errorMsg,
} = storeToRefs(sessionStore);

const { createSession } = sessionStore;

const NAME_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 250;

type SessionTiming = "live" | "upcoming";

const sessionType = ref<SessionType>("qna");
const sessionTiming = ref<SessionTiming>("live");
const upcomingDate = ref("");
const dateInputType = ref<"text" | "datetime-local">("text");

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const timezone = ref(browserTimezone);

const timezoneOptions = computed(() => {
  const zones: string[] =
    typeof (Intl as any).supportedValuesOf === "function"
      ? (Intl as any).supportedValuesOf("timeZone")
      : [browserTimezone];
  return zones.map((tz) => ({
    value: tz,
    label: (tz.split("/").pop() ?? tz).replace(/_/g, " "),
  }));
});

const sessionTypes: { value: SessionType; label: string }[] = [
  { value: "qna", label: "Q&A" },
  { value: "survey", label: "Survey" },
  { value: "poll", label: "Poll" },
];

const timingOptions: { value: SessionTiming; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
];

const isUpcoming = computed(() => sessionTiming.value === "upcoming");

const generateAccessCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  accessCode.value = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

const onDateFocus = () => {
  dateInputType.value = "datetime-local";
};
const onDateBlur = () => {
  if (!upcomingDate.value) dateInputType.value = "text";
};

const resetLocalState = () => {
  sessionType.value = "qna";
  sessionTiming.value = "live";
  upcomingDate.value = "";
  dateInputType.value = "text";
  timezone.value = browserTimezone;
};

watch(showModal, (val) => {
  if (!val) resetLocalState();
});

const closeModal = () => {
  showModal.value = false;
};

const handleCreateSession = async () => {
  errorMsg.value = "";
  let startsAt: Date | null = null;
  if (isUpcoming.value) {
    startsAt = zonedDateTimeToUtc(upcomingDate.value, timezone.value);
    if (startsAt.getTime() <= Date.now()) {
      errorMsg.value = "The upcoming session date must be in the future.";
      return;
    }
  }
  const success = await createSession({ type: sessionType.value, startsAt });
  if (success) {
    closeModal();
    if (sessionStore.createdSession) {
      sessionStore.openShareModal(sessionStore.createdSession);
    }
  }
};
</script>

<template>
  <form
    @submit.prevent="handleCreateSession"
    class="font-inter bg-white rounded-[12px] w-[467px] max-w-full relative overflow-hidden"
  >
    <!-- Header -->
    <div class="relative h-[49px] border-b border-[#ececec]">
      <h2 class="absolute left-4 top-[18px] text-[16px] font-medium leading-[normal] text-black">
        Add a new session
      </h2>
      <button
        type="button"
        @click="closeModal"
        aria-label="Close"
        class="absolute right-4 top-4 size-[18px] opacity-100 hover:opacity-70 transition-opacity"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <div class="px-4 pt-4 pb-[22px]">
      <!-- Session type switcher -->
      <div class="grid grid-cols-3 gap-1 h-16 p-1 bg-[#f3f3f3] rounded-[12px]">
        <button
          v-for="type in sessionTypes"
          :key="type.value"
          type="button"
          @click="sessionType = type.value"
          :class="[
            'flex flex-col items-center justify-center gap-[6px] rounded-[8px] border transition-colors',
            sessionType === type.value
              ? 'bg-white border-[#ececec]'
              : 'border-transparent hover:bg-white/60',
          ]"
        >
          <svg v-if="type.value === 'qna'" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.75 15.75L9 12.75L5.25 15.75M5.1 12.75H12.9C14.16 12.75 14.79 12.75 15.2715 12.5048C15.6948 12.289 16.039 11.9448 16.2547 11.5215C16.5 11.04 16.5 10.41 16.5 9.15V5.85C16.5 4.59 16.5 3.96 16.2547 3.4785C16.039 3.05515 15.6948 2.71096 15.2715 2.49525C14.79 2.25 14.16 2.25 12.9 2.25H5.1C3.84 2.25 3.21 2.25 2.7285 2.49525C2.30515 2.71096 1.96096 3.05515 1.74525 3.4785C1.5 3.96 1.5 4.59 1.5 5.85V9.15C1.5 10.41 1.5 11.04 1.74525 11.5215C1.96096 11.9448 2.30515 12.289 2.7285 12.5048C3.21 12.75 3.84 12.75 5.1 12.75Z" stroke="#262523" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else-if="type.value === 'survey'" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.25 5.25H12.75M5.25 9H12.75M5.25 12.75H9.75M14.25 2.25H3.75C3.35218 2.25 2.97064 2.40804 2.68934 2.68934C2.40804 2.97064 2.25 3.35218 2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H14.25C14.6478 15.75 15.0294 15.592 15.3107 15.3107C15.592 15.0294 15.75 14.6478 15.75 14.25V3.75C15.75 3.35218 15.592 2.97064 15.3107 2.68934C15.0294 2.40804 14.6478 2.25 14.25 2.25Z" stroke="#262523" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.75 9V6M11.25 9V7.5M9 9V8.25M2.25 3H15.75M3 3V10.5C3 10.8978 3.15804 11.2794 3.43934 11.5607C3.72064 11.842 4.10218 12 4.5 12H13.5C13.8978 12 14.2794 11.842 14.5607 11.5607C14.842 11.2794 15 10.8978 15 10.5V3M9 12V15M6.75 15H11.25" stroke="#262523" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text-[14px] leading-[normal] text-[#262523]">{{ type.label }}</span>
        </button>
      </div>

      <!-- Fields -->
      <div class="mt-[22px] flex flex-col gap-4">
        <!-- Name -->
        <div>
          <label for="session-name" class="block text-[14px] leading-[normal] text-black mb-2">Name</label>
          <div class="relative">
            <input
              id="session-name"
              v-model="sessionName"
              type="text"
              required
              :maxlength="NAME_MAX_LENGTH"
              placeholder="Enter session name"
              :disabled="loading"
              class="w-full h-[34px] pl-[10px] pr-[60px] border border-[#e1e1e1] rounded-[6px] text-[14px] text-black placeholder:text-[#666] outline-none focus:border-[#d4382a] transition-colors"
            />
            <span class="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-[#1b1b1b] pointer-events-none">
              {{ sessionName.length }}/{{ NAME_MAX_LENGTH }}
            </span>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="session-description" class="block text-[14px] leading-[normal] text-black mb-2">Description</label>
          <div class="relative">
            <textarea
              id="session-description"
              v-model="sessionDescription"
              rows="2"
              :maxlength="DESCRIPTION_MAX_LENGTH"
              placeholder="Describe your session"
              :disabled="loading"
              class="block w-full h-[56px] pl-[10px] pr-[60px] py-[8px] border border-[#e1e1e1] rounded-[6px] text-[14px] leading-[normal] text-black placeholder:text-[#666] outline-none resize-none focus:border-[#d4382a] transition-colors"
            ></textarea>
            <span class="absolute right-[10px] top-[9px] text-[12px] text-[#1b1b1b] pointer-events-none">
              {{ sessionDescription.length }}/{{ DESCRIPTION_MAX_LENGTH }}
            </span>
          </div>
        </div>

        <!-- Access code -->
        <div>
          <label for="session-access-code" class="block text-[14px] leading-[normal] text-black mb-2">Access code</label>
          <div class="relative">
            <input
              id="session-access-code"
              v-model="accessCode"
              type="text"
              placeholder="Enter access code"
              :disabled="loading"
              class="w-full h-[34px] pl-[10px] pr-[150px] border border-[#e1e1e1] rounded-[6px] text-[14px] text-black placeholder:text-[#666] outline-none focus:border-[#d4382a] transition-colors"
            />
            <button
              id="generate-access-code"
              type="button"
              @click="generateAccessCode"
              :disabled="loading"
              class="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-[#1b1b1b] underline hover:text-[#d4382a] transition-colors"
            >
              Generate automatically
            </button>
          </div>
        </div>

        <!-- Session duration -->
        <div>
          <label for="session-duration" class="block text-[14px] leading-[normal] text-black mb-2">Session duration</label>
          <div class="relative">
            <input
              v-if="isPremium"
              id="session-duration"
              v-model.number="customDuration"
              type="number"
              min="1"
              max="72"
              placeholder="Set the session duration"
              :disabled="loading"
              class="w-full h-[34px] pl-[10px] pr-[60px] border border-[#e1e1e1] rounded-[6px] text-[14px] text-black placeholder:text-[#666] outline-none focus:border-[#d4382a] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <input
              v-else
              id="session-duration"
              type="text"
              disabled
              placeholder="Set the session duration"
              class="w-full h-[34px] pl-[10px] pr-[90px] bg-white border border-[#e1e1e1] rounded-[6px] text-[14px] placeholder:text-[#666] outline-none cursor-not-allowed"
            />
            <span class="absolute right-[10px] top-1/2 -translate-y-1/2 text-[14px] text-[#666] pointer-events-none">
              {{ isPremium ? "hours" : "Forced 2h" }}
            </span>
          </div>
        </div>

        <!-- Live / Upcoming -->
        <div class="flex items-center gap-3" role="radiogroup">
          <label
            v-for="option in timingOptions"
            :key="option.value"
            class="flex items-center gap-[6px] cursor-pointer"
          >
            <input
              :id="`session-timing-${option.value}`"
              v-model="sessionTiming"
              type="radio"
              name="session-timing"
              :value="option.value"
              class="sr-only"
            />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="10"
                cy="10"
                r="8.333"
                :stroke="sessionTiming === option.value ? '#d4382a' : '#AAAAAA'"
                stroke-width="1.5"
              />
              <circle v-if="sessionTiming === option.value" cx="10" cy="10" r="4.5" fill="#d4382a" />
            </svg>
            <span class="text-[14px] leading-[normal] text-black">{{ option.label }}</span>
          </label>
        </div>

        <!-- Upcoming session date -->
        <div :class="{ 'opacity-50': !isUpcoming }">
          <label for="session-date" class="block text-[14px] leading-[normal] text-black mb-2">Upcoming session date</label>
          <input
            id="session-date"
            v-model="upcomingDate"
            :type="dateInputType"
            placeholder="Set the session date"
            :disabled="!isUpcoming || loading"
            :required="isUpcoming"
            @focus="onDateFocus"
            @blur="onDateBlur"
            class="w-full h-[34px] px-[10px] bg-white border border-[#e1e1e1] rounded-[6px] text-[14px] text-black placeholder:text-[#666] outline-none focus:border-[#d4382a] transition-colors disabled:cursor-not-allowed"
          />
        </div>

        <!-- Timezone -->
        <div :class="{ 'opacity-50': !isUpcoming }">
          <label for="session-timezone" class="block text-[14px] leading-[normal] text-black mb-2">Timezone</label>
          <select
            id="session-timezone"
            v-model="timezone"
            :disabled="!isUpcoming || loading"
            class="w-full h-[34px] px-[10px] bg-white border border-[#e1e1e1] rounded-[6px] text-[14px] text-[#666] outline-none appearance-none focus:border-[#d4382a] transition-colors disabled:cursor-not-allowed"
          >
            <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
              {{ tz.label }}
            </option>
          </select>
        </div>
      </div>

      <p v-if="errorMsg" class="mt-4 text-[12px] text-[#d4382a]">{{ errorMsg }}</p>

      <!-- Actions -->
      <div class="mt-[31px] flex justify-end gap-3">
        <button
          id="cancel-create-session"
          type="button"
          @click="closeModal"
          class="px-2 py-[6px] rounded-[6px] bg-[#f3f3f3] text-[14px] leading-[normal] text-[#666] hover:bg-[#e9e9e9] transition-colors"
        >
          Cancel
        </button>
        <button
          id="submit-create-session"
          type="submit"
          :disabled="loading"
          class="px-2 py-[6px] rounded-[6px] bg-[#d4382a] text-[14px] leading-[normal] text-white hover:bg-[#bf3123] transition-colors disabled:opacity-50"
        >
          {{ loading ? "Creating..." : "Create" }}
        </button>
      </div>
    </div>
  </form>
</template>
