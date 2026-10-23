<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Question } from '@/types';

const props = defineProps<{
  question: Question;
}>();

const emit = defineEmits<{
  (e: 'upvote', id: number): void;
  (e: 'downvote', id: number): void;
}>();

// État local des votes pour un ressenti immédiat
const userVote = ref<'like' | 'dislike' | null>(null);
const localUpvotesOffset = ref(0);
const localDownvotes = ref(0);

// Initials calculation (e.g. "Alex S." -> "AS", "Anonymous" -> "AN")
const initials = computed(() => {
  const author = props.question.author_name || props.question.authorName;
  if (!author || author.trim().toLowerCase() === 'anonymous') {
    return 'AN';
  }
  const parts = author.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return author.trim().slice(0, 2).toUpperCase();
});

// Relative time formatting matching Figma "il y’a 20 min"
const relativeTime = computed(() => {
  const created = props.question.created_at || props.question.createdAt;
  if (!created) return "il y’a 20 min";

  let dateString = created;
  if (typeof dateString === 'string' && !dateString.endsWith('Z')) {
    dateString = dateString.replace(' ', 'T') + 'Z';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "il y’a 20 min";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "à l’instant";
  if (diffMin < 60) return `il y’a ${diffMin} min`;
  if (diffHours < 24) return `il y’a ${diffHours} h`;
  return `il y’a ${diffDays} j`;
});

const authorDisplayName = computed(() => {
  return props.question.author_name || props.question.authorName || 'Anonymous';
});

const upvotesCount = computed(() => {
  const base = props.question.upvotes ?? 0;
  return Math.max(0, base + localUpvotesOffset.value);
});

const handleLike = () => {
  if (userVote.value === 'like') {
    userVote.value = null;
    localUpvotesOffset.value = 0;
  } else {
    if (userVote.value === 'dislike') {
      localDownvotes.value = Math.max(0, localDownvotes.value - 1);
    }
    userVote.value = 'like';
    localUpvotesOffset.value = 1;
    emit('upvote', props.question.id);
  }
};

const handleDislike = () => {
  if (userVote.value === 'dislike') {
    userVote.value = null;
    localDownvotes.value = 0;
  } else {
    if (userVote.value === 'like') {
      localUpvotesOffset.value = 0;
    }
    userVote.value = 'dislike';
    localDownvotes.value = 1;
    emit('downvote', props.question.id);
  }
};
</script>

<template>
  <div class="flex gap-[8px] items-start w-full">
    <!-- Avatar rond 24x24 px violet #633F99 avec initiales blanches 11px -->
    <div class="shrink-0 size-[24px] rounded-full bg-[#633F99] flex items-center justify-center select-none">
      <span class="font-['Inter'] font-medium text-[11px] text-white leading-none">
        {{ initials }}
      </span>
    </div>

    <!-- Contenu de la question et réactions -->
    <div class="flex flex-col gap-[10px] items-start flex-1 min-w-0">
      <!-- En-tête auteur & temps + Texte question -->
      <div class="flex flex-col gap-[7px] items-start w-full">
        <!-- Ligne auteur et timestamp -->
        <div class="flex gap-[7px] items-center text-[12px] whitespace-nowrap">
          <p class="font-['Inter'] font-medium text-black leading-normal">
            {{ authorDisplayName }}
          </p>
          <p class="font-['Inter'] font-normal text-[#7E7E7E] leading-normal">
            {{ relativeTime }}
          </p>
        </div>

        <!-- Contenu de la question -->
        <p class="font-['Inter'] font-normal text-[14px] leading-normal text-[#212121] break-words w-full">
          {{ question.content }}
        </p>
      </div>

      <!-- Barre de réactions (Thumbs up & Thumbs down) -->
      <div class="flex items-center -ml-2">
        <!-- Bouton Thumbs Up (Like) -->
        <button
          type="button"
          @click="handleLike"
          class="flex items-center gap-[4px] px-[8px] py-[4px] rounded-[50px] hover:bg-gray-100 transition-colors cursor-pointer select-none"
        >
          <svg
            class="shrink-0 size-[16px]"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.3333 5.33333H9.592L10.3407 3.08867C10.4753 2.68333 10.4073 2.234 10.1573 1.88733C9.90733 1.54067 9.502 1.33333 9.07467 1.33333H8C7.802 1.33333 7.61467 1.42133 7.48733 1.57333L4.354 5.33333H2.66667C1.93133 5.33333 1.33333 5.93133 1.33333 6.66667V12.6667C1.33333 13.402 1.93133 14 2.66667 14H11.538C11.8093 13.9991 12.0739 13.9159 12.2968 13.7614C12.5198 13.6069 12.6906 13.3883 12.7867 13.1347L14.6247 8.234C14.6526 8.15915 14.6668 8.07989 14.6667 8V6.66667C14.6667 5.93133 14.0687 5.33333 13.3333 5.33333ZM2.66667 6.66667H4V12.6667H2.66667V6.66667ZM13.3333 7.87933L11.538 12.6667H5.33333V6.24133L8.312 2.66667H9.076L8.03467 5.78867C8.00086 5.88888 7.99143 5.9957 8.00716 6.10028C8.02289 6.20487 8.06332 6.30419 8.12511 6.39003C8.18689 6.47586 8.26825 6.54573 8.36243 6.59384C8.45661 6.64195 8.56091 6.66692 8.66667 6.66667H13.3333V7.87933Z"
              :fill="upvotesCount > 0 || userVote === 'like' ? '#446cb9' : '#7E7E7E'"
            />
          </svg>
          <span
            class="font-['Inter'] font-normal text-[14px] leading-normal"
            :class="upvotesCount > 0 || userVote === 'like' ? 'text-[#446cb9]' : 'text-[#666666]'"
          >
            {{ upvotesCount }}
          </span>
        </button>

        <!-- Bouton Thumbs Down (Dislike) -->
        <button
          type="button"
          @click="handleDislike"
          class="flex items-center gap-[4px] px-[8px] py-[4px] rounded-[50px] hover:bg-gray-100 transition-colors cursor-pointer select-none"
        >
          <svg
            class="shrink-0 size-[14px]"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.6667 1.75H3.90425C3.6669 1.75079 3.43537 1.82359 3.24029 1.95879C3.0452 2.09398 2.89574 2.2852 2.81167 2.50717L1.20342 6.79525C1.179 6.86075 1.16655 6.9301 1.16667 7V8.16667C1.16667 8.81008 1.68992 9.33333 2.33333 9.33333H5.607L4.9525 11.2974C4.89396 11.4728 4.87792 11.6595 4.90571 11.8423C4.9335 12.025 5.00432 12.1986 5.11233 12.3486C5.33167 12.6519 5.68517 12.8333 6.05967 12.8333H7C7.17325 12.8333 7.33717 12.7563 7.44858 12.6233L10.1902 9.33333H11.6667C12.3101 9.33333 12.8333 8.81008 12.8333 8.16667V2.91667C12.8333 2.27325 12.3101 1.75 11.6667 1.75ZM6.72642 11.6667H6.0585L6.96967 8.93433C6.99886 8.84669 7.00682 8.75336 6.99289 8.66203C6.97896 8.57071 6.94353 8.484 6.88954 8.40904C6.83554 8.33408 6.76451 8.27302 6.6823 8.23088C6.60009 8.18875 6.50905 8.16674 6.41667 8.16667H2.33333V7.10558L3.90425 2.91667H9.33333V8.53883L6.72642 11.6667ZM10.5 8.16667V2.91667H11.6667L11.6672 8.16667H10.5Z"
              :fill="userVote === 'dislike' ? '#d4382a' : '#7E7E7E'"
            />
          </svg>
          <span
            class="font-['Inter'] font-normal text-[14px] leading-normal"
            :class="userVote === 'dislike' ? 'text-[#d4382a]' : 'text-[#666666]'"
          >
            {{ localDownvotes }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
