<script setup>
defineProps({
  badgeLabel: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    class="px-2 border border-yellow-300 bg-yellow-50 rounded-[4px] text-center flex items-center justify-center py-1"
  >
    <p class="text-[11px] text-center text-yellow-600 leading-none">{{ badgeLabel }}</p>
  </div>
</template>
