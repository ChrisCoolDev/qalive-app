<script setup lang="ts">
import { sidebarIcons } from './SidebarIcons'

const props = defineProps<{
  /** Key from SidebarIcons registry */
  icon: string
  /** Display label */
  label: string
  /** Optional counter badge (Analytics items) */
  count?: number
  /** Whether this item is currently active */
  isActive?: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()

const iconDef = sidebarIcons[props.icon]
</script>

<template>
  <div
    @click="$emit('click')"
    class="px-2.5 py-2 rounded-md hover:bg-[#FFF0E5] hover:text-[#9D250F] text-[15px] cursor-pointer flex items-center justify-between group"
    :class="isActive ? 'bg-[#FFF0E5] text-[#9D250F]' : 'text-[#262523]'"
  >
    <div class="flex items-center space-x-2">
      <svg
        v-if="iconDef"
        class="w-4 h-4"
        :width="iconDef.size?.width ?? '100%'"
        :height="iconDef.size?.height ?? '100%'"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        :viewBox="iconDef.viewBox ?? '0 0 24 24'"
      >
        <path
          v-for="(d, i) in iconDef.paths"
          :key="i"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-width="iconDef.strokeWidth ?? '1.5'"
          :d="d"
        />
      </svg>
      <span>{{ label }}</span>
    </div>
    <p
      v-if="count !== undefined"
      class="text-[#AAAAAA] group-hover:text-[#9D250F]"
    >
      {{ count }}
    </p>
  </div>
</template>
