<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useFileStore } from '@/stores/fileStore';
import { storeToRefs } from 'pinia';
import { isSessionExpired } from '@/utils/sessionStatus';

const isOpen = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');

const sessionStore = useSessionStore();
const fileStore = useFileStore();
const { files, uploading } = storeToRefs(fileStore);

const isExpired = computed(() => {
  return isSessionExpired(sessionStore.selectedSession);
});

// Suivre la session sélectionnée pour charger et synchroniser ses fichiers
watch(
  () => sessionStore.selectedSession?.id,
  (sessionId) => {
    if (sessionId) {
      fileStore.fetchFiles(sessionId);
      fileStore.subscribeToFiles(sessionId);
    } else {
      fileStore.unsubscribeFromFiles();
    }
  },
  { immediate: true }
);

const filteredFiles = computed(() => {
  const list = files.value || [];
  if (!searchQuery.value.trim()) return list;
  return list.filter((f: any) =>
    f.file_name?.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
  );
});

const handleClickOutside = (event: MouseEvent) => {
  if (popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const triggerFileInput = () => {
  if (isExpired.value) return;
  fileInputRef.value?.click();
};

const handleFileUpload = async (event: Event) => {
  if (isExpired.value) return;
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const sessionId = sessionStore.selectedSession?.id;
  if (!sessionId) return;

  try {
    await fileStore.uploadFile(file, sessionId);
  } catch (err) {
    console.error('Failed to upload file:', err);
  } finally {
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  fileStore.unsubscribeFromFiles();
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="relative" ref="popoverRef">
    <!-- Bouton déclencheur dans la sidebar -->
    <div
      @click="isOpen = !isOpen"
      class="w-[227px] h-[32px] px-[14px] flex items-center gap-[7px] bg-[#F9F9F9] rounded-[8px] cursor-pointer select-none"
    >
      <svg class="frame shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 4.5H13C13.5304 4.5 14.0391 4.71071 14.4142 5.08579C14.7893 5.46086 15 5.96957 15 6.5V9.5C15 10.0304 14.7893 10.5391 14.4142 10.9142C14.0391 11.2893 13.5304 11.5 13 11.5H3C2.46957 11.5 1.96086 11.2893 1.58579 10.9142C1.21071 10.5391 1 10.0304 1 9.5V6.5C1 5.96957 1.21071 5.46086 1.58579 5.08579C1.96086 4.71071 2.46957 4.5 3 4.5ZM3 5.5C2.73478 5.5 2.48043 5.60536 2.29289 5.79289C2.10536 5.98043 2 6.23478 2 6.5V9.5C2 9.76522 2.10536 10.0196 2.29289 10.2071C2.48043 10.3946 2.73478 10.5 3 10.5H13C13.2652 10.5 13.5196 10.3946 13.7071 10.2071C13.8946 10.0196 14 9.76522 14 9.5V6.5C14 6.23478 13.8946 5.98043 13.7071 5.79289C13.5196 5.60536 13.2652 5.5 13 5.5H3ZM1 2C1 1.86739 1.05268 1.74021 1.14645 1.64645C1.24021 1.55268 1.36739 1.5 1.5 1.5H14.5C14.6326 1.5 14.7598 1.55268 14.8536 1.64645C14.9473 1.74021 15 1.86739 15 2C15 2.13261 14.9473 2.25979 14.8536 2.35355C14.7598 2.44732 14.6326 2.5 14.5 2.5H1.5C1.36739 2.5 1.24021 2.44732 1.14645 2.35355C1.05268 2.25979 1 2.13261 1 2ZM1 14C1 13.8674 1.05268 13.7402 1.14645 13.6464C1.24021 13.5527 1.36739 13.5 1.5 13.5H14.5C14.6326 13.5 14.7598 13.5527 14.8536 13.6464C14.9473 13.7402 15 13.8674 15 14C15 14.1326 14.9473 14.2598 14.8536 14.3536C14.7598 14.4473 14.6326 14.5 14.5 14.5H1.5C1.36739 14.5 1.24021 14.4473 1.14645 14.3536C1.05268 14.2598 1 14.1326 1 14Z" fill="#6E686A" />
      </svg>
      <p class="font-['Inter'] text-[13px] text-[#6E686A] whitespace-nowrap">Shared files</p>
    </div>

    <!-- Dropdown popover -->
    <div v-if="isOpen" class="absolute top-[38px] left-0 z-50 w-[292px]">
      <div class="w-[292px] bg-white px-3 pt-[14px] pb-[14px] shadow-[0px_2px_20px_1px_rgba(0,0,0,0.14)] rounded-[10px]">
        <!-- Champ recherche -->
        <div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Type a file name..."
            class="placeholder:text-[#666666] text-[13px] px-[10px] h-[34px] w-full border border-[#E1E1E1] rounded-[6px] outline-none focus:border-gray-400"
          />
        </div>

        <!-- En-tête des fichiers -->
        <h4 class="text-black font-medium text-[13px] mt-[12px] leading-[16px]">
          Files <span class="text-[#AAAAAA] font-normal">{{ filteredFiles.length }}</span>
        </h4>

        <!-- État vide (Empty State) conforme à la maquette Figma -->
        <div v-if="filteredFiles.length === 0" class="mt-[14px] mb-[31px] flex items-center justify-center gap-2">
          <svg class="shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.66667 4.66667L7.92267 3.17933C7.70933 2.75133 7.602 2.53733 7.44267 2.38067C7.30135 2.24228 7.13101 2.13708 6.944 2.07267C6.73333 2 6.49333 2 6.01467 2H3.46667C2.72 2 2.34667 2 2.06133 2.14533C1.81046 2.27316 1.6065 2.47713 1.47867 2.728C1.33333 3.01333 1.33333 3.38667 1.33333 4.13333V4.66667M1.33333 4.66667H11.4667C12.5867 4.66667 13.1467 4.66667 13.5747 4.88467C13.951 5.07641 14.2569 5.38236 14.4487 5.75867C14.6667 6.18667 14.6667 6.74667 14.6667 7.86667V10.8C14.6667 11.92 14.6667 12.48 14.4487 12.908C14.2569 13.2843 13.951 13.5903 13.5747 13.782C13.1467 14 12.5867 14 11.4667 14H4.53333C3.41333 14 2.85333 14 2.42533 13.782C2.04903 13.5903 1.74308 13.2843 1.55133 12.908C1.33333 12.48 1.33333 11.92 1.33333 10.8V4.66667ZM6.33333 7.66667L9.66667 11M9.66667 7.66667L6.33333 11"
              stroke="#AAAAAA"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="text-[#AAAAAA] text-[14px] leading-normal font-normal">
            Not shared file now
          </p>
        </div>

        <!-- Liste des fichiers existants -->
        <div v-else class="mt-3">
          <div class="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            <div
              v-for="file in filteredFiles"
              :key="file.id"
              class="flex items-center space-x-2 py-1"
            >
              <svg class="shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M14 4.5V14C14 14.5304 13.7893 15.0391 13.4142 15.4142C13.0391 15.7893 12.5304 16 12 16H11V15H12C12.2652 15 12.5196 14.8946 12.7071 14.7071C12.8946 14.5196 13 14.2652 13 14V4.5H11C10.6022 4.5 10.2206 4.34196 9.93934 4.06066C9.65804 3.77936 9.5 3.39782 9.5 3V1H4C3.73478 1 3.48043 1.10536 3.29289 1.29289C3.10536 1.48043 3 1.73478 3 2V11H2V2C2 1.46957 2.21071 0.960859 2.58579 0.585786C2.96086 0.210714 3.46957 0 4 0L9.5 0L14 4.5ZM1.6 11.85H0V15.849H0.791V14.507H1.594C1.88067 14.507 2.12467 14.4493 2.326 14.334C2.52933 14.2173 2.68367 14.0593 2.789 13.86C2.89879 13.6515 2.95417 13.4186 2.95 13.183C2.95 12.933 2.89733 12.7073 2.792 12.506C2.68648 12.307 2.52707 12.1417 2.332 12.029C2.132 11.909 1.888 11.8493 1.6 11.85ZM2.145 13.183C2.1484 13.3147 2.1192 13.4453 2.06 13.563C2.00692 13.6656 1.92392 13.7496 1.822 13.804C1.70551 13.8614 1.5768 13.8895 1.447 13.886H0.788V12.48H1.448C1.666 12.48 1.83667 12.5403 1.96 12.661C2.08333 12.783 2.145 12.957 2.145 13.183ZM3.362 11.85V15.849H4.822C5.22333 15.849 5.556 15.77 5.82 15.612C6.08716 15.4522 6.29577 15.2106 6.415 14.923C6.54567 14.623 6.611 14.2617 6.611 13.839C6.611 13.419 6.54567 13.0607 6.415 12.764C6.29693 12.4799 6.09038 12.2414 5.826 12.084C5.562 11.928 5.227 11.85 4.821 11.85H3.362ZM4.153 12.495H4.716C4.96333 12.495 5.16633 12.5457 5.325 12.647C5.48952 12.7555 5.61389 12.915 5.679 13.101C5.75767 13.3023 5.797 13.5533 5.797 13.854C5.8001 14.0534 5.77724 14.2525 5.729 14.446C5.69451 14.599 5.62768 14.7429 5.533 14.868C5.44599 14.9801 5.33072 15.0671 5.199 15.12C5.04465 15.1777 4.88074 15.2055 4.716 15.202H4.153V12.495ZM7.896 14.258V15.849H7.106V11.85H9.654V12.503H7.896V13.62H9.502V14.258H7.896Z"
                  fill="#525151"
                />
              </svg>
              <a
                :href="file.file_url"
                target="_blank"
                download
                class="text-[13px] text-black underline truncate hover:text-[#D4382A] transition-colors"
                :title="file.file_name"
              >
                {{ file.file_name }}
              </a>
            </div>
          </div>
          <div class="h-[1px] bg-[#E1E1E1] my-3"></div>
        </div>

        <!-- Bouton Partager un nouveau fichier -->
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          :disabled="isExpired || uploading"
          @change="handleFileUpload"
        />
        <button
          @click="triggerFileInput"
          :disabled="uploading || isExpired"
          :class="[
            'flex items-center justify-center rounded-[6px] text-[13px] w-full h-[28px] py-[6px] px-2 transition-colors select-none',
            isExpired
              ? 'bg-[#F2F2F2] text-[#AAAAAA] cursor-not-allowed border border-[#E1E1E1]'
              : 'text-white bg-[#D4382A] hover:bg-[#b82f23] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
          ]"
          :title="isExpired ? 'Session expired. New files cannot be uploaded.' : ''"
        >
          <span v-if="isExpired">Session expired</span>
          <span v-else-if="uploading">Uploading...</span>
          <span v-else>Share a new file</span>
        </button>
      </div>
    </div>
  </div>
</template>
