<script setup lang="ts">
import QuestionCard from '../features/QuestionCard.vue';
import SharedFilePopover from './SessionSideBar/SharedFilePopover.vue';

</script>

<template>
  <div class="py-6 px-4 h-full w-[324px] min-w-[324px] max-w-[324px] bg-white z-40 border-l border-l-[#E8E8E8] absolute top-0 right-0 space-y-3">
    <div class="flex items-center justify-between w-full">
      <h2 class="text-[16px] font-semibold text-balck">Conf Google I/O Berlin 2027</h2>
      <svg class="frame" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L4 12M4 4L12 12" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <div class="flex items-center space-x-[10px]">
      <SharedFilePopover />
      <button class="flex items-center justify-center bg-[#D4382A] text-white px-2 py-[6px] rounded-[6px] text-[14px] cursor-pointer">Share</button>
    </div>
    <div class="space-y-[10px]">
      <QuestionCard />
      <QuestionCard />
      <QuestionCard />
    </div>
  </div>
</template>
