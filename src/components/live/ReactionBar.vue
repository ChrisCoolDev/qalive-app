<script setup>
import { ref } from 'vue'
import { REACTION_CATALOG, createReactionLimiter } from '@/lib/liveRoom'
import FloatingReactions from '@/components/live/FloatingReactions.vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['react'])

const limiter = createReactionLimiter()
const activeKey = ref(null)
const floatingRef = ref(null)

function triggerReaction(item, index) {
  if (props.disabled) return
  if (!limiter.tryAcquire()) return

  activeKey.value = item.key
  setTimeout(() => {
    if (activeKey.value === item.key) activeKey.value = null
  }, 180)

  // Position approximative au-dessus du bouton pressé (entre 15% et 85%)
  const leftPercent = 15 + index * 17.5
  floatingRef.value?.spawn(item.emoji, leftPercent)

  emit('react', { key: item.key, emoji: item.emoji })
}
</script>

<template>
  <div>
    <FloatingReactions ref="floatingRef" size="sm" />

    <nav
      aria-label="Live reactions"
      class="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E6E6E6] px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
    >
      <div class="max-w-md mx-auto flex items-center justify-around gap-1">
        <button
          v-for="(item, idx) in REACTION_CATALOG"
          :key="item.key"
          type="button"
          :disabled="disabled"
          @click="triggerReaction(item, idx)"
          class="group flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-lg transition-all duration-150 select-none active:scale-90 hover:bg-[#F6F5EF] disabled:opacity-40"
          :class="activeKey === item.key ? 'bg-[#F6F5EF] scale-110' : ''"
        >
          <span
            class="text-2xl leading-none transition-transform duration-150 group-hover:scale-110"
          >
            {{ item.emoji }}
          </span>
          <span class="text-[11px] font-medium text-gray-600 mt-1 group-hover:text-[#161924]">
            {{ item.label }}
          </span>
        </button>
      </div>
    </nav>
  </div>
</template>

