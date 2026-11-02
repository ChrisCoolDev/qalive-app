<script setup>
import { computed } from "vue";
import { parseUTCDate } from "@/utils/dateHelper";

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
});

// Formate l'heure pour un affichage court
const formattedTime = computed(() => {
  const date = parseUTCDate(props.question.created_at);
  if (!date || isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
});
</script>

<template>
  <div
    class="border border-[#E6E6E6] p-4 space-y-2 rounded-[6px] bg-white cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-300"
  >
    <p class="text-xs text-gray-500">{{ formattedTime }}</p>

    <h2 class="text-base font-medium text-gray-800 truncate">
      {{ question.content }}
    </h2>

    <p class="text-gray-600 text-[13px]">{{ question.author_name || "Anonymous" }}</p>
  </div>
</template>
