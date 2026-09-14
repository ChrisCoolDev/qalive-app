<script setup lang="ts">
import BreadcrumNav from './TopBar/BreadcrumNav.vue';
import NotificationItem from './TopBar/NotificationItem.vue';
</script>

<template>
  <div class="w-full flex items-center justify-between py-4 px-[30px]">
      <BreadcrumNav />
      <NotificationItem />
  </div>
</template>
