<script setup>
defineProps({
  dashboardInformation: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="px-4 py-3 rounded-[6px] space-y-1 border border-solid border-[#E6E6E6]">
    <div class="flex items-center space-x-[14px]">
      <div class="flex items-center justify-center p-2 bg-[#F6F5EF] rounded-[6px]">
        <div v-html="dashboardInformation.icon"></div>
      </div>
      <div class="space-y-">
        <p class="text-[15px] font-medium leading-none">
          {{ dashboardInformation.name }}
        </p>
        <span class="text-[13px] text-[#5D5D5D] leading-none">{{
          dashboardInformation.label
        }}</span>
      </div>
    </div>
    <p class="text-md font-bold">{{ dashboardInformation.statistic }}</p>
  </div>
</template>
