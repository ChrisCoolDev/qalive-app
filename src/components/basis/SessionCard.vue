<script setup>
import { computed } from 'vue'

const props = defineProps({
  session: Object,
})

// Formater la date pour un affichage plus simple (ex: 7 Octobre 2025)
const formattedDate = computed(() => {
  if (!props.session.created_at) return ''
  return new Date(props.session.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})
</script>

<template>
  <RouterLink :to="`/session/${session.id}`">
    <div
      class="border border-solid border-primary py-3 px-5 space-y-2 rounded-lg hover:shadow-md transition-shadow"
    >
      <p class="text-sm text-gray-500">{{ formattedDate }}</p>
      <h2 class="text-lg font-medium text-primary">{{ session.name }}</h2>
      <!-- Le nombre de questions n'est pas directement dans la table `sessions`.
           Il faudra le calculer séparément si vous souhaitez l'afficher ici. -->
      <!-- <p>{{ session.questionCount }} questions</p> -->
    </div>
    <RouterLink :to="`/session/${session.id}/qrcode`" class="p-2 bg-gray-200 rounded">
      <!-- Icône de QR code -->
      <span class="material-symbols-outlined text-primary text-xs"> qr_code </span>
    </RouterLink>
  </RouterLink>
</template>
