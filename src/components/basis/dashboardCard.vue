<script setup>
defineProps({
  dashboardInformation: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="bg-white px-[20px] py-4 rounded-[6px] space-y-2 border border-solid border-[#C9C9C9]">
    <div class="flex items-center space-x-[18px]">
      <img :src="dashboardInformation.imagePath" class="w-10 h-10" alt="Total events" />
      <div>
        <p class="text-base font-medium">{{ dashboardInformation.name }}</p>
        <span class="text-[13px] text-[#5D5D5D]">{{ dashboardInformation.label }}</span>
      </div>
    </div>
    <p class="text-xl font-bold">{{ dashboardInformation.statistic }}</p>
  </div>
</template>
