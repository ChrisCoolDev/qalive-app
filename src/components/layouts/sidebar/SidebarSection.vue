<script setup lang="ts">
defineProps<{
  /** Section heading text */
  title: string
}>()
</script>

<template>
  <div class="space-y-[6px]">
    <p class="text-[12px] px-2.5 text-[#262523]">{{ title }}</p>
    <div class="space-y-0.5 mt-0.5">
      <slot />
    </div>
  </div>
</template>
