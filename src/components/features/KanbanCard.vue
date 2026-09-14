<script setup lang="ts">
import { computed } from 'vue'
import type { Session } from '@/types'

const props = defineProps<{
  session: Session
}>()

const emit = defineEmits<{
  (e: 'delete', id: number): void
  (e: 'archive', id: number): void
}>()

const formattedDate = computed(() => {
  if (!props.session.createdAt) return ''
  return new Date(props.session.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
})

const logoVariants = [
  '/logos/logo-variants/logo_variant_1.png',
  '/logos/logo-variants/logo_variant_2.png',
  '/logos/logo-variants/logo_variant_3.png',
]

const logoUrl = computed(() => {
  if (props.session.logoUrl) return props.session.logoUrl
  const idStr = String(props.session.id)
  let hash = 0
  for (let i = 0; i < idStr.length; i++) {
    hash += idStr.charCodeAt(i)
  }
  return logoVariants[hash % logoVariants.length]
})
</script>

<template>
  <div
    class="bg-white border border-[#E1E1E1w z] rounded-xl p-3 cursor-pointer flex flex-col space-y-3 group text-[#37352f] relative"
  >
    <!-- Notion Card Header with Image/Icon -->
    <div class="flex items-start space-x-3">
      <div class="">
        <svg class="frame" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_10_25)">
              <path d="M9.99984 18.3334C14.6023 18.3334 18.3332 14.6026 18.3332 10.0001C18.3332 5.39758 14.6023 1.66675 9.99984 1.66675C5.39734 1.66675 1.6665 5.39758 1.6665 10.0001C1.6665 14.6026 5.39734 18.3334 9.99984 18.3334Z" stroke="#AAAAAA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <defs>
              <clipPath id="clip0_10_25">
                  <rect width="20" height="20" fill="white" />
              </clipPath>
          </defs>
        </svg>
      </div>
      <div>
        <div class=" justify-between min-w-0 mb-2">
          <div class="">
            <RouterLink :to="`/session/${session.slug}`" class="block min-w-0 flex-grow">
              <h4 class="text-[16px] font-medium text-black truncate leading-snug">
                {{ session.name }}
              </h4>
            </RouterLink>
          </div>
          <!-- Action Hover Overlays -->
          <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white pl-1 rounded-bl-md">
            <RouterLink
              :to="`/session/${session.slug}/qrcode`"
              class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"
              title="Share QR Code"
            >
              <span class="material-symbols-outlined text-[15px]">qr_code</span>
            </RouterLink>
            <button
              v-if="session.is_active"
              @click.stop="emit('delete', session.id)"
              class="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
              title="Delete session"
            >
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </div>
        <!-- Notion Database Properties (Clean, label on left, value on right) -->
        <div class="space-y-1 text-[14px] font-sans">
          <div class="flex items-center space-x-[10px]">
            <div class="flex items-center space-x-1">
              <svg class="frame" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.66667 5.668C6.78365 5.33343 7.01543 5.05115 7.32084 4.87129C7.62625 4.69144 7.98552 4.62564 8.33484 4.68559C8.68417 4.74555 9.00094 4.92737 9.2289 5.19876C9.45687 5.47016 9.58126 5.81357 9.58 6.168C9.58 7.16733 8.08 7.66667 8.08 7.66667M8.1 9.66667H8.10667M6.6 12.8L7.57333 14.098C7.718 14.2913 7.79067 14.3873 7.87933 14.422C7.95695 14.4521 8.04305 14.4521 8.12067 14.422C8.20933 14.3873 8.282 14.2907 8.42667 14.098L9.4 12.8C9.59533 12.54 9.69333 12.4093 9.81267 12.31C9.97152 12.1771 10.1591 12.0831 10.3607 12.0353C10.5113 12 10.674 12 11 12C11.932 12 12.398 12 12.7653 11.848C13.0081 11.7475 13.2286 11.6001 13.4144 11.4144C13.6001 11.2286 13.7475 11.0081 13.848 10.7653C14 10.398 14 9.932 14 9V5.2C14 4.08 14 3.52 13.782 3.092C13.5903 2.71569 13.2843 2.40974 12.908 2.218C12.48 2 11.92 2 10.8 2H5.2C4.08 2 3.52 2 3.092 2.218C2.71569 2.40974 2.40974 2.71569 2.218 3.092C2 3.52 2 4.08 2 5.2V9C2 9.932 2 10.398 2.152 10.7653C2.25251 11.0081 2.39986 11.2286 2.58563 11.4144C2.77139 11.6001 2.99194 11.7475 3.23467 11.848C3.602 12 4.068 12 5 12C5.326 12 5.48867 12 5.64 12.0353C5.84128 12.0832 6.02867 12.1772 6.18733 12.31C6.30733 12.4093 6.40467 12.5393 6.6 12.8Z" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="text-[#666666] text-[14px]">20</span>
            </div>
            <p class="text-[#666666] py-0.5 rounded text-[14px] w-full flex items-center space-x-[8px] " :title="session.accessCode || 'public'">
                <p>{{ session.accessCode || 'VNKSJNJNJB43TN' }} </p>
                <div>
                <svg class="w-4 h-4" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="#0D0D0D" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 15c-.932 0-1.398 0-1.765-.152a2 2 0 0 1-1.083-1.083C2 13.398 2 12.932 2 12V5.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874C3.52 2 4.08 2 5.2 2H12c.932 0 1.398 0 1.765.152a2 2 0 0 1 1.083 1.083C15 3.602 15 4.068 15 5m-2.8 17h6.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C22 20.48 22 19.92 22 18.8v-6.6c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C20.48 9 19.92 9 18.8 9h-6.6c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C9 10.52 9 11.08 9 12.2v6.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C10.52 22 11.08 22 12.2 22"/></svg>
                </div>
            </p>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#666] w-20 flex-shrink-0 text-[12px]">21/04/2026</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
