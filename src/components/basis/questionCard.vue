<script setup>
import { computed } from "vue";

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
});

// Formate l'heure pour un affichage court
const formattedTime = computed(() => {
  if (!props.question.created_at) return "";

  // 1. On sécurise le format de la date
  let dateString = props.question.created_at;

  // Si la date vient de la DB sous forme "2023-12-16 14:30:00" sans le Z,
  // on force le format ISO UTC ("2023-12-16T14:30:00Z")
  if (typeof dateString === "string" && !dateString.endsWith("Z")) {
    dateString = dateString.replace(" ", "T") + "Z";
  }

  // 2. Création de l'objet Date (le navigateur convertit automatiquement en local ici)
  const date = new Date(dateString);

  // 3. Affichage au format français (utilisera le fuseau horaire du navigateur)
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
