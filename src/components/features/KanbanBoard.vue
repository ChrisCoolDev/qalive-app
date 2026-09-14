<script setup lang="ts">
import { computed } from 'vue'
import type { Session } from '@/types'
import KanbanColumn from './KanbanColumn.vue'

const props = defineProps<{
  sessions: Session[]
}>()

const emit = defineEmits<{
  (e: 'delete-session', id: number): void
  (e: 'archive-session', id: number): void
}>()

// Split sessions into columns based on status
const activeSessions = computed(() => {
  return props.sessions.filter(s => s.is_active)
})

const upcomingSessions = computed(() => {

  })

const expiredSessions = computed(() => {
  return props.sessions.filter(s => !s.is_active)
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 h-full items-start">
    <!-- Upcoming Column -->
    <KanbanColumn
      title="Upcoming"
      badge-color="#CADEF6"
      dot-color="#2883DE"
      column-bg="#F5F9FD"
      text-color="#375980"
      empty-button-color="#4492E2"
      empty-action-text="Set an upcoming session"
      :sessions="activeSessions"
      @delete-session="emit('delete-session', $event)"
      @archive-session="emit('archive-session', $event)"
    />

    <!-- Active / Live Column -->
    <KanbanColumn
      title="Active"
      badge-color="#D3E0D6"
      dot-color="#46A171"
      column-bg="#F6F9F7"
      text-color="#496D58"
      empty-button-color="#5AAB80"
      empty-action-text="Create an instantly session"
      :sessions="activeSessions"
      @delete-session="emit('delete-session', $event)"
      @archive-session="emit('archive-session', $event)"
    />

    <!-- Expired Column -->
    <KanbanColumn
      title="Expired"
      badge-color="#E4D5F0"
      dot-color="#B577D6"
      column-bg="#FAF7FC"
      text-color="#765F88"
      :sessions="expiredSessions"
      @delete-session="emit('delete-session', $event)"
      @archive-session="emit('archive-session', $event)"
    />


  </div>
</template>
