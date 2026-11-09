<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuestionStore } from '@/stores/questionStore'
import { useFileStore } from '@/stores/fileStore'
import ParticipantQuestionItem from './ParticipantQuestionItem.vue'

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'open-share-qr', 'select-question'])

const questionStore = useQuestionStore()
const { questions, loading } = storeToRefs(questionStore)
const { fetchQuestions, subscribeToQuestions, unsubscribeFromQuestions } = questionStore

const fileStore = useFileStore()
const { files, uploading: fileUploading, errorMsg: fileErrorMsg } = storeToRefs(fileStore)
const { fetchFiles, uploadFile, subscribeToFiles, unsubscribeFromFiles } = fileStore

const showSharedFilesPopover = ref(false)
const fileSearchQuery = ref('')
const fileInputRef = ref(null)
const popoverContainerRef = ref(null)

const formattedSessionName = computed(() => {
  const raw = props.session?.name ? String(props.session.name).trim() : ''
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1)
})

const filteredFiles = computed(() => {
  const q = fileSearchQuery.value.toLowerCase().trim()
  const list = files.value || []
  if (!q) return list
  return list.filter((f) => String(f.file_name || '').toLowerCase().includes(q))
})

function toggleSharedFilesPopover() {
  showSharedFilesPopover.value = !showSharedFilesPopover.value
  if (!showSharedFilesPopover.value) {
    fileSearchQuery.value = ''
    fileErrorMsg.value = ''
  }
}

function triggerFilePicker() {
  if (fileUploading.value) return
  fileErrorMsg.value = ''
  fileInputRef.value?.click()
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file || !props.session?.id) return
  try {
    await uploadFile(file, props.session.id)
  } catch {
    // Error is stored in fileStore.errorMsg
  } finally {
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function handleDocumentClick(event) {
  if (!showSharedFilesPopover.value) return
  if (popoverContainerRef.value && !popoverContainerRef.value.contains(event.target)) {
    showSharedFilesPopover.value = false
    fileSearchQuery.value = ''
    fileErrorMsg.value = ''
  }
}

const handleShareQr = () => {
  emit('open-share-qr', props.session)
}

watch(
  () => props.session?.slug,
  async (newSlug) => {
    unsubscribeFromQuestions()
    unsubscribeFromFiles()
    showSharedFilesPopover.value = false
    fileSearchQuery.value = ''
    fileErrorMsg.value = ''

    if (!newSlug) return
    await fetchQuestions(newSlug)
    if (props.session?.id) {
      subscribeToQuestions(props.session.id)
      await fetchFiles(props.session.id)
      subscribeToFiles(props.session.id)
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
  unsubscribeFromQuestions()
  unsubscribeFromFiles()
})
</script>

<template>
  <aside
    class="fixed top-0 right-0 h-screen w-[324px] max-w-full bg-white border-l border-[#e8e8e8] z-40 flex flex-col shadow-sm"
  >
    <!-- Header (Figma node 371:498) -->
    <div class="px-[16px] pt-[23px] flex items-center justify-between gap-3 w-full">
      <h2
        class="text-[16px] font-semibold leading-normal text-black truncate first-letter:uppercase"
        :title="formattedSessionName"
      >
        {{ formattedSessionName }}
      </h2>
      <button
        type="button"
        @click="$emit('close')"
        aria-label="Close sidebar"
        class="w-[16px] h-[16px] shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4L8 8M8 8L4 12M8 8L4 4M8 8L12 12"
            stroke="#666666"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Action bar: Shared files + Share QR (Figma node 371:502) -->
    <div
      ref="popoverContainerRef"
      class="px-[16px] mt-[15px] flex items-center justify-between gap-[6px] relative"
    >
      <button
        type="button"
        @click="toggleSharedFilesPopover"
        class="w-[212px] h-[32px] bg-[#f9f9f9] hover:bg-[#f1f1f1] rounded-[8px] px-[13px] flex items-center gap-[7px] transition-colors shrink-0"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="shrink-0"
        >
          <path
            d="M3 4.5H13C13.5304 4.5 14.0391 4.71071 14.4142 5.08579C14.7893 5.46086 15 5.96957 15 6.5V9.5C15 10.0304 14.7893 10.5391 14.4142 10.9142C14.0391 11.2893 13.5304 11.5 13 11.5H3C2.46957 11.5 1.96086 11.2893 1.58579 10.9142C1.21071 10.5391 1 10.0304 1 9.5V6.5C1 5.96957 1.21071 5.46086 1.58579 5.08579C1.96086 4.71071 2.46957 4.5 3 4.5ZM3 5.5C2.73478 5.5 2.48043 5.60536 2.29289 5.79289C2.10536 5.98043 2 6.23478 2 6.5V9.5C2 9.76522 2.10536 10.0196 2.29289 10.2071C2.48043 10.3946 2.73478 10.5 3 10.5H13C13.2652 10.5 13.5196 10.3946 13.7071 10.2071C13.8946 10.0196 14 9.76522 14 9.5V6.5C14 6.23478 13.8946 5.98043 13.7071 5.79289C13.5196 5.60536 13.2652 5.5 13 5.5H3ZM1 2C1 1.86739 1.05268 1.74021 1.14645 1.64645C1.24021 1.55268 1.36739 1.5 1.5 1.5H14.5C14.6326 1.5 14.7598 1.55268 14.8536 1.64645C14.9473 1.74021 15 1.86739 15 2C15 2.13261 14.9473 2.25979 14.8536 2.35355C14.7598 2.44732 14.6326 2.5 14.5 2.5H1.5C1.36739 2.5 1.24021 2.44732 1.14645 2.35355C1.05268 2.25979 1 2.13261 1 2ZM1 14C1 13.8674 1.05268 13.7402 1.14645 13.6464C1.24021 13.5527 1.36739 13.5 1.5 13.5H14.5C14.6326 13.5 14.7598 13.5527 14.8536 13.6464C14.9473 13.7402 15 13.8674 15 14C15 14.1326 14.9473 14.2598 14.8536 14.3536C14.7598 14.4473 14.6326 14.5 14.5 14.5H1.5C1.36739 14.5 1.24021 14.4473 1.14645 14.3536C1.05268 14.2598 1 14.1326 1 14Z"
            fill="#6E686A"
          />
        </svg>
        <span class="text-[14px] font-normal text-[#6e686a] leading-normal whitespace-nowrap">
          Shared files
        </span>
      </button>

      <button
        type="button"
        @click="handleShareQr"
        class="h-[31px] w-[78px] bg-[#E85D4A] hover:bg-[#d44d3c] rounded-[6px] px-[8px] py-[6px] flex items-center justify-center text-[14px] font-normal text-white whitespace-nowrap transition-colors shrink-0"
      >
        Share QR
      </button>

      <!-- Popover Shared files (Figma nodes 371:641 & 371:659) -->
      <div
        v-if="showSharedFilesPopover"
        class="absolute left-[16px] top-[39px] w-[292px] min-h-[179px] bg-white rounded-[10px] shadow-[0px_2px_20px_1px_rgba(0,0,0,0.14)] px-[12px] py-[14px] z-30 flex flex-col justify-between gap-[14px]"
      >
        <div class="flex flex-col gap-[12px] w-full">
          <!-- Search input (Figma node 371:645) -->
          <input
            v-model="fileSearchQuery"
            type="text"
            placeholder="Type a file name..."
            class="w-full h-[34px] px-[10px] border border-[#e1e1e1] rounded-[6px] text-[14px] font-normal text-black placeholder:text-[#666] outline-none focus:border-[#E85D4A] transition-colors"
          />

          <div class="flex flex-col gap-[14px] w-full">
            <!-- Files counter (Figma node 371:649 / 371:662) -->
            <p class="text-[13px] font-medium leading-normal text-black">
              <span>Files </span>
              <span class="font-normal text-[#aaa]">{{ filteredFiles.length }}</span>
            </p>

            <!-- Empty state (Figma node 371:666) -->
            <div
              v-if="filteredFiles.length === 0"
              class="flex items-center justify-center gap-[8px] py-[6px] w-full"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="shrink-0"
              >
                <path
                  d="M8.66667 4.66667L7.92267 3.17933C7.70933 2.75133 7.602 2.53733 7.44267 2.38067C7.30135 2.24228 7.13101 2.13708 6.944 2.07267C6.73333 2 6.49333 2 6.01467 2H3.46667C2.72 2 2.34667 2 2.06133 2.14533C1.81046 2.27316 1.6065 2.47713 1.47867 2.728C1.33333 3.01333 1.33333 3.38667 1.33333 4.13333V4.66667M8.66667 4.66667H1.33333M8.66667 4.66667H11.4667C12.5867 4.66667 13.1467 4.66667 13.5747 4.88467C13.951 5.07641 14.2569 5.38236 14.4487 5.75867C14.6667 6.18666 14.6667 6.74666 14.6667 7.86665V7.86667V10.8V10.8C14.6667 11.92 14.6667 12.48 14.4487 12.908C14.2569 13.2843 13.951 13.5903 13.5747 13.782C13.1467 14 12.5867 14 11.4667 14H11.4667H4.53333H4.53332C3.41333 14 2.85333 14 2.42533 13.782C2.04903 13.5903 1.74308 13.2843 1.55133 12.908C1.33333 12.48 1.33333 11.92 1.33333 10.8V4.66667M6.33333 7.66667L8 9.33333M8 9.33333L9.66667 11M8 9.33333L9.66667 7.66667M8 9.33333L6.33333 11"
                  stroke="#AAAAAA"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span class="text-[14px] font-normal leading-normal text-[#aaa] whitespace-nowrap">
                Not shared file now
              </span>
            </div>

            <!-- Files list (Figma node 371:650) -->
            <div
              v-else
              class="flex flex-col gap-[10px] max-h-[130px] overflow-y-auto w-full"
            >
              <div
                v-for="file in filteredFiles"
                :key="file.id"
                class="flex flex-col gap-[10px] w-full"
              >
                <a
                  :href="file.file_url"
                  target="_blank"
                  rel="noopener"
                  download
                  class="flex items-start gap-[8px] group w-full"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="shrink-0 mt-[1px]"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M14 4.5V14C14 14.5304 13.7893 15.0391 13.4142 15.4142C13.0391 15.7893 12.5304 16 12 16H11V15H12C12.2652 15 12.5196 14.8946 12.7071 14.7071C12.8946 14.5196 13 14.2652 13 14V4.5H11C10.6022 4.5 10.2206 4.34196 9.93934 4.06066C9.65804 3.77936 9.5 3.39782 9.5 3V1H4C3.73478 1 3.48043 1.10536 3.29289 1.29289C3.10536 1.48043 3 1.73478 3 2V11H2V2C2 1.46957 2.21071 0.960859 2.58579 0.585786C2.96086 0.210714 3.46957 0 4 0L9.5 0L14 4.5ZM1.6 11.85H0V15.849H0.791V14.507H1.594C1.88067 14.507 2.12467 14.4493 2.326 14.334C2.52933 14.2173 2.68367 14.0593 2.789 13.86C2.89879 13.6515 2.95417 13.4186 2.95 13.183C2.95 12.933 2.89733 12.7073 2.792 12.506C2.68648 12.307 2.52707 12.1417 2.332 12.029C2.132 11.909 1.888 11.8493 1.6 11.85ZM2.145 13.183C2.1484 13.3147 2.1192 13.4453 2.06 13.563C2.00692 13.6656 1.92392 13.7496 1.822 13.804C1.70551 13.8614 1.5768 13.8895 1.447 13.886H0.788V12.48H1.448C1.666 12.48 1.83667 12.5403 1.96 12.661C2.08333 12.783 2.145 12.957 2.145 13.183ZM3.362 11.85V15.849H4.822C5.22333 15.849 5.556 15.77 5.82 15.612C6.08716 15.4522 6.29577 15.2106 6.415 14.923C6.54567 14.623 6.611 14.2617 6.611 13.839C6.611 13.419 6.54567 13.0607 6.415 12.764C6.29693 12.4799 6.09038 12.2414 5.826 12.084C5.562 11.928 5.227 11.85 4.821 11.85H3.362ZM4.153 12.495H4.716C4.96333 12.495 5.16633 12.5457 5.325 12.647C5.48952 12.7555 5.61389 12.915 5.679 13.101C5.75767 13.3023 5.797 13.5533 5.797 13.854C5.8001 14.0534 5.77724 14.2524 5.729 14.446C5.69451 14.599 5.62768 14.7429 5.533 14.868C5.44599 14.9801 5.33072 15.0671 5.199 15.12C5.04465 15.1777 4.88074 15.2055 4.716 15.202H4.153V12.495ZM7.896 14.258V15.849H7.106V11.85H9.654V12.503H7.896V13.62H9.502V14.258H7.896Z"
                      fill="#525151"
                    />
                  </svg>
                  <span
                    class="text-[14px] font-normal leading-normal text-[#525151] underline truncate group-hover:text-black transition-colors"
                    :title="file.file_name"
                  >
                    {{ file.file_name }}
                  </span>
                </a>
                <div class="h-[1px] w-full bg-[#ECECEC]"></div>
              </div>
            </div>
          </div>
        </div>

        <p v-if="fileErrorMsg" class="text-[13px] text-[#E85D4A] leading-tight">
          {{ fileErrorMsg }}
        </p>

        <!-- Hidden file input + Share a new file button (Figma node 371:656) -->
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          @change="handleFileSelect"
        />
        <button
          type="button"
          :disabled="fileUploading"
          @click="triggerFilePicker"
          class="w-full h-[32px] bg-[#E85D4A] hover:bg-[#d44d3c] rounded-[6px] px-[8px] py-[6px] flex items-center justify-center text-[14px] font-normal text-white whitespace-nowrap transition-colors disabled:opacity-50"
        >
          {{ fileUploading ? 'Sharing...' : 'Share a new file' }}
        </button>
      </div>
    </div>

    <!-- Activity section (Figma node 371:511) -->
    <div class="px-[16px] mt-[15px] flex-1 overflow-y-auto pb-6">
      <p class="text-[14px] font-medium leading-normal text-[#212121]">
        <span>Activity </span>
        <span class="text-[#6e686a]">{{ questions.length }}</span>
      </p>

      <div v-if="loading" class="mt-[18px] text-[13px] text-[#7e7e7e]">
        Loading activity...
      </div>

      <div
        v-else-if="questions.length === 0"
        class="mt-[18px] text-[13px] text-[#7e7e7e]"
      >
        No questions yet. Share the QR code with your audience to get started.
      </div>

      <div v-else class="mt-[18px] flex flex-col gap-[10px]">
        <ParticipantQuestionItem
          v-for="question in questions"
          :key="question.id"
          :question="question"
          @select="$emit('select-question', $event)"
        />
      </div>
    </div>
  </aside>
</template>
