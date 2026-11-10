<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

const sessionStore = useSessionStore()
const {
  sessionName,
  accessCode,
  customDuration,
  showModal,
  loading,
  isPremium,
  errorMsg,
} = storeToRefs(sessionStore)

const { createSession, redirectToSessionQrCode } = sessionStore

const NAME_MAX_LENGTH = 120

const sessionType = ref('qna')
const sessionTiming = ref('live')
const upcomingDate = ref('')
const dateInputType = ref('text')

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const timezone = ref(browserTimezone)

const timezoneOptions = computed(() => {
  const zones =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [browserTimezone]
  return zones.map((tz) => ({
    value: tz,
    label: (tz.split('/').pop() ?? tz).replace(/_/g, ' '),
  }))
})

const sessionTypes = [
  { value: 'qna', label: 'Q&A', disabled: false },
  { value: 'survey', label: 'Survey', disabled: true },
  { value: 'poll', label: 'Poll', disabled: true },
]

const timingOptions = [
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
]

const isUpcoming = computed(() => sessionTiming.value === 'upcoming')

// Tooltip flottant collé au curseur ("Coming soon" ou "Pro feature")
const tooltipVisible = ref(false)
const tooltipText = ref('Coming soon')
const tooltipPos = ref({ x: 0, y: 0 })

function showCursorTooltip(event, text = 'Coming soon') {
  tooltipText.value = text
  tooltipVisible.value = true
  tooltipPos.value = { x: event.clientX, y: event.clientY }
}

function moveCursorTooltip(event) {
  tooltipPos.value = { x: event.clientX, y: event.clientY }
}

function hideCursorTooltip() {
  tooltipVisible.value = false
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const asUTC = Date.UTC(+map.year, +map.month - 1, +map.day, +map.hour, +map.minute, +map.second)
  return asUTC - date.getTime()
}

function zonedDateTimeToUtc(localValue, timeZone) {
  const [datePart, timePart = '00:00'] = localValue.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [h, min] = timePart.split(':').map(Number)
  const utcGuess = Date.UTC(y, m - 1, d, h, min)
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone)
  return new Date(utcGuess - offset)
}

const generateAccessCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  accessCode.value = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

const onDateFocus = () => {
  dateInputType.value = 'datetime-local'
}

const onDateBlur = () => {
  if (!upcomingDate.value) dateInputType.value = 'text'
}

const resetLocalState = () => {
  sessionType.value = 'qna'
  sessionTiming.value = 'live'
  upcomingDate.value = ''
  dateInputType.value = 'text'
  timezone.value = browserTimezone
  tooltipVisible.value = false
  errorMsg.value = ''
}

watch(showModal, (val) => {
  if (!val) resetLocalState()
})

const closeModal = () => {
  showModal.value = false
}

const handleCreateSession = async () => {
  errorMsg.value = ''
  let startsAt = null
  if (isUpcoming.value) {
    if (!upcomingDate.value) {
      errorMsg.value = 'Please select an upcoming session date.'
      return
    }
    startsAt = zonedDateTimeToUtc(upcomingDate.value, timezone.value)
    if (isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      errorMsg.value = 'The upcoming session date must be in the future.'
      return
    }
  }

  const success = await createSession({ type: sessionType.value, startsAt })
  if (success) {
    redirectToSessionQrCode()
  }
}
</script>

<template>
  <form
    @submit.prevent="handleCreateSession"
    class="bg-white rounded-[12px] w-[467px] max-w-full relative overflow-hidden shadow-xl"
  >
    <!-- Header (Figma node 48:457 / 48:454) -->
    <div class="relative h-[49px] border-b border-[#ececec]">
      <h2 class="absolute left-4 top-[18px] text-[16px] font-medium leading-[normal] text-black">
        Add a new session
      </h2>
      <button
        type="button"
        @click="closeModal"
        aria-label="Close"
        class="absolute right-4 top-4 w-[18px] h-[18px] opacity-100 hover:opacity-70 transition-opacity flex items-center justify-center"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5"
            stroke="#666666"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div class="px-4 pt-4 pb-[22px]">
      <!-- Session type switcher (Figma node 48:472) -->
      <div class="grid grid-cols-3 gap-1 h-[64px] p-1 bg-[#f3f3f3] rounded-[12px]">
        <button
          v-for="type in sessionTypes"
          :key="type.value"
          type="button"
          :aria-disabled="type.disabled"
          @click="!type.disabled && (sessionType = type.value)"
          @mouseenter="type.disabled && showCursorTooltip($event, 'Coming soon')"
          @mousemove="type.disabled && moveCursorTooltip($event)"
          @mouseleave="type.disabled && hideCursorTooltip()"
          :class="[
            'flex flex-col items-center justify-center gap-[6px] rounded-[8px] border transition-colors h-[56px]',
            type.disabled
              ? 'border-transparent cursor-not-allowed opacity-75'
              : sessionType === type.value
                ? 'bg-white border-[#ececec]'
                : 'border-transparent hover:bg-white/60 cursor-pointer',
          ]"
        >
          <svg
            v-if="type.value === 'qna'"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.75 15.75L9 12.75L5.25 15.75M5.1 12.75H12.9C14.16 12.75 14.79 12.75 15.2715 12.5048C15.6948 12.289 16.039 11.9448 16.2547 11.5215C16.5 11.04 16.5 10.41 16.5 9.15V5.85C16.5 4.59 16.5 3.96 16.2547 3.4785C16.039 3.05515 15.6948 2.71096 15.2715 2.49525C14.79 2.25 14.16 2.25 12.9 2.25H5.1C3.84 2.25 3.21 2.25 2.7285 2.49525C2.30515 2.71096 1.96096 3.05515 1.74525 3.4785C1.5 3.96 1.5 4.59 1.5 5.85V9.15C1.5 10.41 1.5 11.04 1.74525 11.5215C1.96096 11.9448 2.30515 12.289 2.7285 12.5048C3.21 12.75 3.84 12.75 5.1 12.75Z"
              stroke="#262523"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            v-else-if="type.value === 'survey'"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.25 5.25H12.75M5.25 9H12.75M5.25 12.75H9.75M14.25 2.25H3.75C3.35218 2.25 2.97064 2.40804 2.68934 2.68934C2.40804 2.97064 2.25 3.35218 2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H14.25C14.6478 15.75 15.0294 15.592 15.3107 15.3107C15.592 15.0294 15.75 14.6478 15.75 14.25V3.75C15.75 3.35218 15.592 2.97064 15.3107 2.68934C15.0294 2.40804 14.6478 2.25 14.25 2.25Z"
              stroke="#262523"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.75 9V6M11.25 9V7.5M9 9V8.25M2.25 3H15.75M3 3V10.5C3 10.8978 3.15804 11.2794 3.43934 11.5607C3.72064 11.842 4.10218 12 4.5 12H13.5C13.8978 12 14.2794 11.842 14.5607 11.5607C14.842 11.2794 15 10.8978 15 10.5V3M9 12V15M6.75 15H11.25"
              stroke="#262523"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-[14px] leading-[normal] text-[#262523]">{{ type.label }}</span>
        </button>
      </div>

      <!-- Fields (Figma node 49:522, input height 38px) -->
      <div class="mt-[22px] flex flex-col gap-4">
        <!-- Name -->
        <div>
          <label for="session-name" class="block text-[14px] leading-[normal] text-black mb-2">
            Name
          </label>
          <div class="relative">
            <input
              id="session-name"
              v-model="sessionName"
              type="text"
              required
              :maxlength="NAME_MAX_LENGTH"
              placeholder="Enter session name"
              :disabled="loading"
              class="w-full h-[38px] pl-[10px] pr-[60px] border border-[#e1e1e1] rounded-[6px] text-[14px] text-black placeholder:text-[#666] outline-none focus:border-[#E85D4A] transition-colors"
            />
            <span
              class="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-[#1b1b1b] pointer-events-none"
            >
              {{ sessionName.length }}/{{ NAME_MAX_LENGTH }}
            </span>
          </div>
        </div>

        <!-- Access code (Pro feature) -->
        <div
          @mouseenter="!isPremium && showCursorTooltip($event, 'Pro feature')"
          @mousemove="!isPremium && moveCursorTooltip($event)"
          @mouseleave="!isPremium && hideCursorTooltip()"
        >
          <label
            for="session-access-code"
            class="block text-[14px] leading-[normal] text-black mb-2"
          >
            Access code
          </label>
          <div class="relative">
            <input
              v-if="isPremium"
              id="session-access-code"
              v-model="accessCode"
              type="text"
              placeholder="Enter access code"
              :disabled="loading"
              class="w-full h-[38px] pl-[10px] pr-[150px] border border-[#e1e1e1] rounded-[6px] text-[14px] text-black placeholder:text-[#666] outline-none focus:border-[#E85D4A] transition-colors"
            />
            <input
              v-else
              id="session-access-code"
              type="text"
              disabled
              placeholder="Enter access code"
              class="w-full h-[38px] pl-[10px] pr-[150px] bg-white border border-[#e1e1e1] rounded-[6px] text-[14px] placeholder:text-[#666] outline-none cursor-not-allowed"
            />
            <button
              id="generate-access-code"
              type="button"
              @click="isPremium && generateAccessCode()"
              :disabled="loading || !isPremium"
              :class="[
                'absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-[#1b1b1b] underline transition-colors',
                isPremium ? 'hover:text-[#E85D4A]' : 'opacity-50 cursor-not-allowed',
              ]"
            >
              Generate automatically
            </button>
          </div>
        </div>

        <!-- Session duration -->
        <div
          @mouseenter="!isPremium && showCursorTooltip($event, 'Pro feature')"
          @mousemove="!isPremium && moveCursorTooltip($event)"
          @mouseleave="!isPremium && hideCursorTooltip()"
        >
          <label
            for="session-duration"
            class="block text-[14px] leading-[normal] text-black mb-2"
          >
            Session duration
          </label>
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
              class="w-full h-[38px] pl-[10px] pr-[60px] border border-[#e1e1e1] rounded-[6px] text-[14px] text-black placeholder:text-[#666] outline-none focus:border-[#E85D4A] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <input
              v-else
              id="session-duration"
              type="text"
              disabled
              placeholder="Set the session duration"
              class="w-full h-[38px] pl-[10px] pr-[90px] bg-white border border-[#e1e1e1] rounded-[6px] text-[14px] placeholder:text-[#666] outline-none cursor-not-allowed"
            />
            <span
              class="absolute right-[10px] top-1/2 -translate-y-1/2 text-[14px] text-[#666] pointer-events-none"
            >
              {{ isPremium ? 'hours' : 'Forced 1h' }}
            </span>
          </div>
        </div>

        <!-- Live / Upcoming radio group (Figma node 49:538, Upcoming is Pro feature) -->
        <div class="flex items-center gap-[12px]" role="radiogroup">
          <label
            v-for="option in timingOptions"
            :key="option.value"
            @mouseenter="
              option.value === 'upcoming' && !isPremium && showCursorTooltip($event, 'Pro feature')
            "
            @mousemove="option.value === 'upcoming' && !isPremium && moveCursorTooltip($event)"
            @mouseleave="option.value === 'upcoming' && !isPremium && hideCursorTooltip()"
            :class="[
              'flex items-center gap-[6px]',
              option.value === 'upcoming' && !isPremium
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer',
            ]"
          >
            <input
              :id="`session-timing-${option.value}`"
              v-model="sessionTiming"
              type="radio"
              name="session-timing"
              :value="option.value"
              :disabled="option.value === 'upcoming' && !isPremium"
              class="sr-only"
            />
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="10"
                cy="10"
                r="8.333"
                :stroke="sessionTiming === option.value ? '#E85D4A' : '#AAAAAA'"
                stroke-width="1.5"
              />
              <circle
                v-if="sessionTiming === option.value"
                cx="10"
                cy="10"
                r="4.5"
                fill="#E85D4A"
              />
            </svg>
            <span class="text-[14px] leading-[normal] text-black">{{ option.label }}</span>
          </label>
        </div>

        <!-- Upcoming session date -->
        <div
          :class="{ 'opacity-50': !isUpcoming }"
          @mouseenter="!isPremium && showCursorTooltip($event, 'Pro feature')"
          @mousemove="!isPremium && moveCursorTooltip($event)"
          @mouseleave="!isPremium && hideCursorTooltip()"
        >
          <label for="session-date" class="block text-[14px] leading-[normal] text-black mb-2">
            Upcoming session date
          </label>
          <input
            id="session-date"
            v-model="upcomingDate"
            :type="dateInputType"
            placeholder="Set the session date"
            :disabled="!isUpcoming || !isPremium || loading"
            :required="isUpcoming && isPremium"
            @focus="onDateFocus"
            @blur="onDateBlur"
            class="w-full h-[38px] px-[10px] bg-white border border-[#e1e1e1] rounded-[6px] text-[14px] text-black placeholder:text-[#666] outline-none focus:border-[#E85D4A] transition-colors disabled:cursor-not-allowed"
          />
        </div>

        <!-- Timezone -->
        <div
          :class="{ 'opacity-50': !isUpcoming }"
          @mouseenter="!isPremium && showCursorTooltip($event, 'Pro feature')"
          @mousemove="!isPremium && moveCursorTooltip($event)"
          @mouseleave="!isPremium && hideCursorTooltip()"
        >
          <label for="session-timezone" class="block text-[14px] leading-[normal] text-black mb-2">
            Timezone
          </label>
          <select
            id="session-timezone"
            v-model="timezone"
            :disabled="!isUpcoming || !isPremium || loading"
            class="w-full h-[38px] px-[10px] bg-white border border-[#e1e1e1] rounded-[6px] text-[14px] text-[#666] outline-none appearance-none focus:border-[#E85D4A] transition-colors disabled:cursor-not-allowed"
          >
            <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
              {{ tz.label }}
            </option>
          </select>
        </div>
      </div>

      <p v-if="errorMsg" class="mt-4 text-[12px] text-[#E85D4A]">{{ errorMsg }}</p>

      <!-- Actions (Figma node 49:545 / 49:546) -->
      <div class="mt-[31px] flex justify-end gap-2">
        <button
          id="cancel-create-session"
          type="button"
          @click="closeModal"
          class="h-[36px] w-[70px] px-[8px] py-[4px] rounded-[6px] bg-[#f3f3f3] text-[14px] leading-[normal] text-[#666] hover:bg-[#e9e9e9] transition-colors flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          id="submit-create-session"
          type="submit"
          :disabled="loading"
          class="h-[36px] min-w-[69px] px-[8px] py-[4px] rounded-[6px] bg-[#E85D4A] text-[14px] leading-[normal] text-white hover:bg-[#d44d3c] transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </button>
      </div>
    </div>

    <!-- Floating cursor tooltip ("Coming soon" or "Pro feature") -->
    <Teleport to="body">
      <div
        v-if="tooltipVisible"
        :style="{
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y - 12}px`,
        }"
        class="fixed -translate-x-1/2 -translate-y-full pointer-events-none z-[100] bg-[#1b1b1b] text-white text-[11px] px-2 py-1 rounded-[4px] whitespace-nowrap shadow-md"
      >
        {{ tooltipText }}
      </div>
    </Teleport>
  </form>
</template>
