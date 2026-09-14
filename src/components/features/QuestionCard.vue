<script setup lang="ts">
import { computed } from "vue";
import type { Question } from "@/types";

const props = defineProps<{
  question: Question
}>();

// Formate l'heure pour un affichage court
const formattedTime = computed(() => {
  if (!props.question.createdAt) return "";

  let dateString = props.question.createdAt;

  if (typeof dateString === "string" && !dateString.endsWith("Z")) {
    dateString = dateString.replace(" ", "T") + "Z";
  }

  const date = new Date(dateString);

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
});
</script>

<template>
  <div
    class="border w-full border-[#E1E1E1] px-4 py-3 space-y-2 rounded-[12px] bg-white cursor-pointer transition-all duration-300"
  >
    <!--<h3 class="text-black font-medium text-[13px]">{{ question.authorName || "Anonymous" }}</h3>
    <p class="text-[#525151] text-[14px]">{{ question.content || "Lorem ipsum dolor sit amet consectetur. Faucibus pellentesque integer proin aenean felis nisl commodo. Habitant justo vitae enim risus neque aliquam placerat congue mauris."}}</p>
    <span class="text-[12px] text-[#AAAAAA]">
      {{ formattedTime || "il y’a 20 min"}}
    </span>-->

    <h3 class="text-black font-medium text-[13px]">{{"Anonymous" }}</h3>
    <p class="text-[#525151] text-[14px]">{{"Lorem ipsum dolor sit amet consectetur. Faucibus pellentesque integer proin aenean felis nisl commodo. Habitant justo vitae enim risus neque aliquam placerat congue mauris."}}</p>
    <span class="text-[12px] text-[#AAAAAA]">
      {{"il y’a 20 min"}}
    </span>

  </div>
</template>
