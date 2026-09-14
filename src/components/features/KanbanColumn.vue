<script setup lang="ts">
import type { Session } from '@/types'
import KanbanCard from './KanbanCard.vue'

defineProps<{
  title: string
  badgeColor: string
  dotColor: string
  columnBg: string
  textColor: string
  emptyButtonColor?: string
  emptyActionText?: string
  sessions: Session[]
}>()

const emit = defineEmits<{
  (e: 'delete-session', id: number): void
  (e: 'archive-session', id: number): void
  (e: 'empty-action'): void
}>()
</script>

<template>
  <div
    class="flex flex-col  min-w-[280px] w-full"
  >
    <!-- Column Header -->
    <div class="flex items-center justify-between mb-3.5 select-none">
      <div
        class=" flex items-center justify-between w-full"
      >
        <h3
          class="text-[14px] text-black"
        >{{ title }} <span class="text-[#AAAAAA]">{{ sessions.length }}</span></h3>
        <div class="cursor-pointer">
          <svg class="frame" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.33317 8.00008C5.33317 8.3537 5.19269 8.69284 4.94265 8.94289C4.6926 9.19294 4.35346 9.33341 3.99984 9.33341C3.64622 9.33341 3.30708 9.19294 3.05703 8.94289C2.80698 8.69284 2.6665 8.3537 2.6665 8.00008C2.6665 7.64646 2.80698 7.30732 3.05703 7.05727C3.30708 6.80722 3.64622 6.66675 3.99984 6.66675C4.35346 6.66675 4.6926 6.80722 4.94265 7.05727C5.19269 7.30732 5.33317 7.64646 5.33317 8.00008ZM9.33317 8.00008C9.33317 8.3537 9.19269 8.69284 8.94265 8.94289C8.6926 9.19294 8.35346 9.33341 7.99984 9.33341C7.64622 9.33341 7.30708 9.19294 7.05703 8.94289C6.80698 8.69284 6.6665 8.3537 6.6665 8.00008C6.6665 7.64646 6.80698 7.30732 7.05703 7.05727C7.30708 6.80722 7.64622 6.66675 7.99984 6.66675C8.35346 6.66675 8.6926 6.80722 8.94265 7.05727C9.19269 7.30732 9.33317 7.64646 9.33317 8.00008ZM11.9998 9.33341C12.3535 9.33341 12.6926 9.19294 12.9426 8.94289C13.1927 8.69284 13.3332 8.3537 13.3332 8.00008C13.3332 7.64646 13.1927 7.30732 12.9426 7.05727C12.6926 6.80722 12.3535 6.66675 11.9998 6.66675C11.6462 6.66675 11.3071 6.80722 11.057 7.05727C10.807 7.30732 10.6665 7.64646 10.6665 8.00008C10.6665 8.3537 10.807 8.69284 11.057 8.94289C11.3071 9.19294 11.6462 9.33341 11.9998 9.33341Z" fill="#666666" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Cards Scrollable Area -->
    <div class="flex-grow overflow-y-auto space-y-3 pr-1 max-h-[calc(100vh-220px)]">
      <KanbanCard
        v-for="session in sessions"
        :key="session.id"
        :session="session"
        @delete="emit('delete-session', $event)"
        @archive="emit('archive-session', $event)"
      />

      <div v-if="sessions.length === 0">
        <button
          v-if="emptyActionText"
          @click="emit('empty-action')"
          class="flex items-center space-x-1.5 w-full"
        >
          <span class="text-[16px] text-[#D4382A] leading-none">+</span>
          <span class="text-[14px] text-[#666666]">new session</span>
        </button>
      </div>
    </div>
  </div>
</template>
