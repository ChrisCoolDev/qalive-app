<script setup>
import { ref, onUnmounted } from 'vue'
import { MAX_STAGE_PARTICLES } from '@/lib/liveRoom'

const props = defineProps({
  /** Taille des emojis ('md' sur mobile, 'lg' sur l'écran de scène) */
  size: {
    type: String,
    default: 'lg',
  },
})

const particles = ref([])
const timers = new Set()
let nextId = 1

function spawn(emoji = '❤️', customLeft = null) {
  const id = nextId++
  const left =
    typeof customLeft === 'number'
      ? customLeft
      : Math.floor(12 + Math.random() * 76) // Entre 12% et 88% de la largeur
  const drift = Math.floor((Math.random() - 0.5) * 90) // Légère oscillation horizontale
  const duration = 2200 + Math.floor(Math.random() * 900)
  const scale = (0.9 + Math.random() * 0.45).toFixed(2)

  // Garde-fou performance : plafonner à MAX_STAGE_PARTICLES particules simultanées
  if (particles.value.length >= MAX_STAGE_PARTICLES) {
    particles.value.shift()
  }

  particles.value.push({
    id,
    emoji,
    left,
    drift,
    duration,
    scale,
  })

  const timer = setTimeout(() => {
    particles.value = particles.value.filter((p) => p.id !== id)
    timers.delete(timer)
  }, duration)
  timers.add(timer)
}

onUnmounted(() => {
  for (const t of timers) clearTimeout(t)
  timers.clear()
})

defineExpose({ spawn })
</script>

<template>
  <div
    class="pointer-events-none fixed inset-0 overflow-hidden z-40 select-none"
    aria-hidden="true"
  >
    <span
      v-for="p in particles"
      :key="p.id"
      class="qalive-floating-reaction absolute bottom-16"
      :class="props.size === 'sm' ? 'text-2xl' : 'text-4xl md:text-5xl'"
      :style="{
        left: `${p.left}%`,
        '--drift-x': `${p.drift}px`,
        '--float-duration': `${p.duration}ms`,
        '--start-scale': p.scale,
      }"
    >
      {{ p.emoji }}
    </span>
  </div>
</template>

<style scoped>
.qalive-floating-reaction {
  will-change: transform, opacity;
  animation: qalive-float-up var(--float-duration, 2500ms) cubic-bezier(0.22, 1, 0.36, 1) forwards;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.14));
}

@keyframes qalive-float-up {
  0% {
    opacity: 0;
    transform: translate3d(0, 20px, 0) scale(0.5);
  }
  15% {
    opacity: 1;
    transform: translate3d(calc(var(--drift-x, 0px) * 0.25), -35px, 0)
      scale(var(--start-scale, 1));
  }
  75% {
    opacity: 0.92;
    transform: translate3d(calc(var(--drift-x, 0px) * 0.8), -260px, 0)
      scale(calc(var(--start-scale, 1) * 1.08));
  }
  100% {
    opacity: 0;
    transform: translate3d(var(--drift-x, 0px), -380px, 0) scale(0.85);
  }
}
</style>

