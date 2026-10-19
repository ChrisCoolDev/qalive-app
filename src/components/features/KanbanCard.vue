<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSessionStore } from '@/stores/sessionStore'
import type { Session } from '@/types'
import { SESSION_TYPE_LABELS, getSessionDateLabel } from '@/utils/sessionStatus'

const sessionStore = useSessionStore()

const props = defineProps<{
  session: Session
}>()

const emit = defineEmits<{
  (e: 'delete', id: number): void
  (e: 'archive', id: number): void
}>()

// --- Date label (Today - Live / Friday - 17:00 / 12/12/2026 - 17:00) ---
const dateInfo = computed(() => getSessionDateLabel(props.session))

const DATE_TONE_COLORS = {
  live: '#1A772D',
  soon: '#633F99',
  default: '#666666',
} as const

const dateColor = computed(() => DATE_TONE_COLORS[dateInfo.value.tone])

const typeLabel = computed(() => SESSION_TYPE_LABELS[props.session.type ?? 'qna'])

// --- Actions menu (Delete / Archive) ---
const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleDelete = () => {
  isMenuOpen.value = false
  emit('delete', props.session.id)
}

const handleArchive = () => {
  isMenuOpen.value = false
  emit('archive', props.session.id)
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div
    @click="sessionStore.openSidebar(props.session)"
    class="group relative w-full bg-white border border-[#E1E1E1] rounded-[12px] pl-[13px] pr-[34px] pt-3 pb-[14px] cursor-pointer flex items-start gap-3"
  >
    <!-- Status circle -->
    <svg class="shrink-0" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 18.3333C14.6025 18.3333 18.3333 14.6025 18.3333 10C18.3333 5.3975 14.6025 1.66667 10 1.66667C5.3975 1.66667 1.66667 5.3975 1.66667 10C1.66667 14.6025 5.3975 18.3333 10 18.3333Z" stroke="#AAAAAA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>

    <div class="min-w-0 flex-1 pt-px">
      <!-- Title -->
      <h4 class="text-[14px] font-medium leading-[normal] text-black truncate">
        {{ session.name }}
      </h4>

      <!-- Description -->
      <p class="mt-2 text-[13px] leading-[normal] text-[#666] truncate">
        {{ session.description || 'No description' }}
      </p>

      <!-- Questions count + date -->
      <div class="mt-3 flex items-center gap-2">
        <div class="flex items-center gap-[2px]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.83333 4.9595C5.9357 4.66675 6.1385 4.41976 6.40574 4.26238C6.67297 4.10501 6.98733 4.04744 7.29299 4.09989C7.59865 4.15235 7.87582 4.31145 8.07529 4.54892C8.27476 4.78639 8.3836 5.08687 8.3825 5.397C8.3825 6.27142 7.07 6.70833 7.07 6.70833M7.0875 8.45833H7.09333M5.775 11.2L6.62667 12.3357C6.75325 12.5049 6.81683 12.5889 6.89442 12.6192C6.96233 12.6456 7.03766 12.6456 7.10558 12.6192C7.18317 12.5889 7.24675 12.5043 7.37333 12.3357L8.225 11.2C8.39592 10.9725 8.48167 10.8582 8.58608 10.7712C8.72508 10.655 8.88925 10.5727 9.06558 10.5309C9.19742 10.5 9.33975 10.5 9.625 10.5C10.4405 10.5 10.8483 10.5 11.1697 10.367C11.3821 10.2791 11.575 10.1501 11.7376 9.98758C11.9001 9.82503 12.0291 9.63205 12.117 9.41967C12.25 9.09825 12.25 8.6905 12.25 7.875V4.55C12.25 3.57 12.25 3.08 12.0592 2.7055C11.8915 2.37623 11.6238 2.10853 11.2945 1.94075C10.92 1.75 10.43 1.75 9.45 1.75H4.55C3.57 1.75 3.08 1.75 2.7055 1.94075C2.37623 2.10853 2.10853 2.37623 1.94075 2.7055C1.75 3.08 1.75 3.57 1.75 4.55V7.875C1.75 8.6905 1.75 9.09825 1.883 9.41967C1.97095 9.63205 2.09988 9.82503 2.26242 9.98758C2.42497 10.1501 2.61795 10.2791 2.83033 10.367C3.15175 10.5 3.5595 10.5 4.375 10.5C4.66025 10.5 4.80258 10.5 4.935 10.5309C5.11112 10.5728 5.27509 10.6551 5.41392 10.7712C5.51892 10.8582 5.60408 10.9719 5.775 11.2Z" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text-[13px] leading-[normal] text-[#666]">{{ session.questionCount ?? 0 }}</span>
        </div>

        <div class="flex items-center gap-[2px] min-w-0">
          <svg class="shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 5.83333H1.75M9.33333 1.16667V3.5M4.66667 1.16667V3.5M4.55 12.8333H9.45C10.43 12.8333 10.92 12.8333 11.2945 12.6426C11.6238 12.4748 11.8915 12.2071 12.0592 11.8778C12.25 11.5033 12.25 11.0133 12.25 10.0333V5.13333C12.25 4.15333 12.25 3.66333 12.0592 3.28883C11.8915 2.95956 11.6238 2.69186 11.2945 2.52408C10.92 2.33333 10.43 2.33333 9.45 2.33333H4.55C3.57 2.33333 3.08 2.33333 2.7055 2.52408C2.37623 2.69186 2.10853 2.95956 1.94075 3.28883C1.75 3.66333 1.75 4.15333 1.75 5.13333V10.0333C1.75 11.0133 1.75 11.5033 1.94075 11.8778C2.10853 12.2071 2.37623 12.4748 2.7055 12.6426C3.08 12.8333 3.57 12.8333 4.55 12.8333Z" :stroke="dateColor" stroke-width="0.9375" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text-[12px] leading-[normal] truncate" :style="{ color: dateColor }">{{ dateInfo.label }}</span>
        </div>
      </div>

      <!-- Type tag -->
      <div class="mt-[9px] flex items-end gap-[2px]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.85714 3.85714H3.86214M0.857143 2.45714V4.69464C0.857143 4.93914 0.857143 5.06114 0.884643 5.17614C0.909643 5.27814 0.949643 5.37614 1.00464 5.46564C1.06614 5.56614 1.15264 5.65264 1.32564 5.82564L5.16014 9.66014C5.75414 10.2541 6.05114 10.5511 6.39364 10.6621C6.69489 10.76 7.01939 10.76 7.32064 10.6621C7.66314 10.5511 7.96064 10.2541 8.55414 9.66014L9.66014 8.55414C10.2541 7.96014 10.5511 7.66314 10.6621 7.32064C10.76 7.01939 10.76 6.69489 10.6621 6.39364C10.5511 6.05114 10.2541 5.75364 9.66014 5.16014L5.82564 1.32564C5.65264 1.15264 5.56614 1.06614 5.46564 1.00464C5.37605 0.949677 5.27835 0.90918 5.17614 0.884643C5.06164 0.857143 4.93964 0.857143 4.69514 0.857143H2.45714C1.89714 0.857143 1.61714 0.857143 1.40314 0.966143C1.21499 1.06201 1.06201 1.21499 0.966143 1.40314C0.857143 1.61714 0.857143 1.89714 0.857143 2.45714ZM4.10714 3.85714C4.10714 3.92345 4.0808 3.98704 4.03392 4.03392C3.98704 4.0808 3.92345 4.10714 3.85714 4.10714C3.79084 4.10714 3.72725 4.0808 3.68037 4.03392C3.63348 3.98704 3.60714 3.92345 3.60714 3.85714C3.60714 3.79084 3.63348 3.72725 3.68037 3.68037C3.72725 3.63348 3.79084 3.60714 3.85714 3.60714C3.92345 3.60714 3.98704 3.63348 4.03392 3.68037C4.0808 3.72725 4.10714 3.79084 4.10714 3.85714Z" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="text-[11px] leading-[normal] text-[#666]">{{ typeLabel }}</span>
      </div>
    </div>

    <!-- "..." actions (visible on hover, or while the menu is open) -->
    <div ref="menuRef" class="absolute top-[14px] right-[9px]" @click.stop>
      <button
        type="button"
        :id="`session-card-actions-${session.id}`"
        @click="toggleMenu"
        aria-label="Session actions"
        :class="[
          'block size-4 transition-opacity',
          isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.33333 8C5.33333 8.35362 5.19286 8.69276 4.94281 8.94281C4.69276 9.19286 4.35362 9.33333 4 9.33333C3.64638 9.33333 3.30724 9.19286 3.05719 8.94281C2.80714 8.69276 2.66667 8.35362 2.66667 8C2.66667 7.64638 2.80714 7.30724 3.05719 7.05719C3.30724 6.80714 3.64638 6.66667 4 6.66667C4.35362 6.66667 4.69276 6.80714 4.94281 7.05719C5.19286 7.30724 5.33333 7.64638 5.33333 8ZM9.33333 8C9.33333 8.35362 9.19286 8.69276 8.94281 8.94281C8.69276 9.19286 8.35362 9.33333 8 9.33333C7.64638 9.33333 7.30724 9.19286 7.05719 8.94281C6.80714 8.69276 6.66667 8.35362 6.66667 8C6.66667 7.64638 6.80714 7.30724 7.05719 7.05719C7.30724 6.80714 7.64638 6.66667 8 6.66667C8.35362 6.66667 8.69276 6.80714 8.94281 7.05719C9.19286 7.30724 9.33333 7.64638 9.33333 8ZM12 9.33333C12.3536 9.33333 12.6928 9.19286 12.9428 8.94281C13.1929 8.69276 13.3333 8.35362 13.3333 8C13.3333 7.64638 13.1929 7.30724 12.9428 7.05719C12.6928 6.80714 12.3536 6.66667 12 6.66667C11.6464 6.66667 11.3072 6.80714 11.0572 7.05719C10.8071 7.30724 10.6667 7.64638 10.6667 8C10.6667 8.35362 10.8071 8.69276 11.0572 8.94281C11.3072 9.19286 11.6464 9.33333 12 9.33333Z" fill="#AAAAAA" />
        </svg>
      </button>

      <div
        v-if="isMenuOpen"
        class="absolute right-0 top-[15px] z-20 w-[100px] p-[4px] flex flex-col gap-[3px] bg-white rounded-[6px] shadow-[0px_2px_20px_1px_rgba(0,0,0,0.14)]"
      >
        <button
          type="button"
          :id="`session-card-delete-${session.id}`"
          @click="handleDelete"
          class="h-[30px] pl-2 flex items-center rounded-[4px] text-[14px] leading-none text-[#666] text-left hover:bg-[#FFF0E5] hover:text-[#912611] transition-colors"
        >
          Delete
        </button>
        <button
          type="button"
          :id="`session-card-archive-${session.id}`"
          @click="handleArchive"
          class="h-[30px] pl-2 flex items-center rounded-[4px] text-[14px] leading-none text-[#666] text-left hover:bg-[#FFF0E5] hover:text-[#912611] transition-colors"
        >
          Archive
        </button>
      </div>
    </div>
  </div>
</template>
