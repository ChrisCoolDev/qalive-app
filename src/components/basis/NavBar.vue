<script setup>
import { ref } from 'vue'

const isActive = ref(false)

const toggleNavBar = () => {
  isActive.value = !isActive.value
}
</script>

<template>
  <div
    class="rounded-full bg-primary justify-center items-center flex py-3 space-x-8 px-6 max-w-max fixed bottom-4 right-[calc(1280px/2)]"
  >
    <a href="/" class="" @click="toggleNavBar">
      <span
        :class="[
          isActive === true ? 'bg-secondary text-primary' : 'text-white',
          'material-symbols-outlined px-4 py-2 rounded-full',
        ]"
      >
        page_menu_ios
      </span>
    </a>
    <a href="/create-session" class="p-2 rounded-full">
      <span class="material-symbols-outlined text-white"> splitscreen_add </span>
    </a>
    <div class="w-11 h-11 rounded-full bg-white"></div>
  </div>
</template>
