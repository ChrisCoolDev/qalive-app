<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAskQuestionRoute = ref(false)

// On surveille les changements de route
watchEffect(() => {
  isAskQuestionRoute.value = route.name === 'AskQuestion'
})
</script>

<template>
  <div class="px-4">
    <main class="mx-auto max-w-[1280px]">
      <!-- ✅ Contenu principal -->
      <div
        :class="[
          // Si c’est la route AskQuestion => toujours visible
          isAskQuestionRoute ? 'block' : 'lg:block hidden',
        ]"
      >
        <slot></slot>
      </div>

      <!-- 🚫 Message d’erreur : visible seulement sur petits écrans
           ET quand ce n’est pas la route AskQuestion -->
      <div v-if="!isAskQuestionRoute" class="lg:hidden h-screen flex items-center justify-center">
        <p class="text-[14px] text-grey-500 text-center max-w-[300px] w-full">
          Sorry but this application is not yet available on small screens
        </p>
      </div>
    </main>
  </div>
</template>
