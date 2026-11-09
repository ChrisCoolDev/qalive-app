<script setup>
import { computed } from 'vue'
import { parseUTCDate } from '@/utils/dateHelper'

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
})

defineEmits(['select'])

const displayAuthor = computed(() => {
  const raw = props.question?.author_name || props.question?.authorName
  return raw && String(raw).trim().length > 0 ? String(raw).trim() : 'Anonymous'
})

const initials = computed(() => {
  const name = displayAuthor.value
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const relativeTime = computed(() => {
  const created = parseUTCDate(props.question?.created_at || props.question?.createdAt)
  if (!created) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000))
  if (diffSec < 60) return "à l'instant"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `il y’a ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `il y’a ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  return `il y’a ${diffDays} j`
})
</script>

<template>
  <div
    @click="$emit('select', question)"
    class="flex gap-[8px] min-h-[66px] items-start w-full cursor-pointer rounded-[6px] p-1 -mx-1 hover:bg-gray-50 transition-colors"
  >
    <!-- Avatar 24x24 (Figma node 371:585) -->
    <div
      class="w-[24px] h-[24px] rounded-full bg-[#633F99] shrink-0 flex items-center justify-center"
    >
      <span class="text-[11px] font-medium leading-none text-white select-none">
        {{ initials }}
      </span>
    </div>

    <!-- Content (Figma node 371:588) -->
    <div class="flex flex-col items-start w-[262px] min-w-0">
      <div class="flex flex-col gap-[7px] items-start w-full">
        <div class="flex gap-[7px] items-center text-[12px] whitespace-nowrap">
          <p class="font-medium text-black leading-normal truncate max-w-[160px]">
            {{ displayAuthor }}
          </p>
          <p class="font-normal text-[#7e7e7e] leading-normal shrink-0">
            {{ relativeTime }}
          </p>
        </div>
        <p class="font-normal text-[#212121] text-[14px] leading-normal break-words w-full">
          {{ question.content }}
        </p>
      </div>
    </div>
  </div>
</template>

