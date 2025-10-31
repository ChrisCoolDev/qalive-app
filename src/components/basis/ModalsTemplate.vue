<script setup>
defineProps({
  modalTitle: {
    type: String,
    required: true,
  },
  modalMessagee: {
    type: String,
    required: true,
  },
  modalButtonLabel: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="showUpgradePlanModal"
        @click.self="showUpgradePlanModal = false"
        class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      >
        <div
          class="space-y-4 bg-white rounded-[6px] px-6 py-8 max-w-[350px] w-full relative"
        >
          <div
            @click="showUpgradePlanModal = false"
            class="absolute top-3 right-5 text-3xl font-light text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined"> close_small </span>
          </div>
          <h2 class="text-lg font-medium text-primary mb-6">{{ modalTitle }}</h2>

          <p class="text-[14px] text-gray-700">{{ modalMessagee }}</p>
          <button
            type="submit"
            class="w-full py-3 px-4 bg-black text-white rounded text-[13px]"
          >
            {{ modalButtonLabel }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
