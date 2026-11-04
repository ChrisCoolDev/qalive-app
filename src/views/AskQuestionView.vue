<script setup>
import { onMounted, onUnmounted as onUnmountedAsk, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/layouts/AppLayout.vue";
import { useFileStore } from "@/stores/fileStore";
import FileList from "@/components/files/FileList.vue";
import { parseUTCDate } from "@/utils/dateHelper";
import { analytics } from "@/lib/analytics";
import { FREE_QUESTION_LIMIT } from "@/stores/questionStore";
import { useLiveRoom } from "@/composables/useLiveRoom";
import { LIVE_ROLES, LIVE_EVENTS } from "@/lib/liveRoom";
import ReactionBar from "@/components/live/ReactionBar.vue";

const route = useRoute();
const sessionSlug = route.params.slug;

// Live Room (Phases 0 & 1) : présence + envoi des réactions live (Broadcast, 0 écriture BDD)
const liveRoom = useLiveRoom(sessionSlug, { role: LIVE_ROLES.AUDIENCE, autoJoin: false });

function handleAudienceReaction({ key, emoji }) {
  liveRoom.send(LIVE_EVENTS.REACTION, { key, emoji });
}

const questionText = ref("");
const authorName = ref("");
const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");
const sessionExpired = ref(false);
const limitReached = ref(false);
const loadingPage = ref(true);

const sessionId = ref(null);
const sessionExpiresAt = ref(null);
const isOwnerPremium = ref(false);
const currentQuestionCount = ref(0);

const fileStore = useFileStore();

async function checkIfLimitReached() {
  if (isOwnerPremium.value || !sessionId.value) return false;

  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId.value);

  if (!error && typeof count === "number") {
    currentQuestionCount.value = count;
    if (count >= FREE_QUESTION_LIMIT) {
      limitReached.value = true;
      return true;
    }
  }
  return false;
}

const submitQuestion = async () => {
  errorMsg.value = "";
  successMsg.value = "";
  loading.value = true;

  // 1. Re-vérifier l'expiration au moment du clic
  if (sessionExpiresAt.value && new Date() > sessionExpiresAt.value) {
    sessionExpired.value = true;
    errorMsg.value = "This questions session is over.";
    loading.value = false;
    return;
  }

  if (sessionExpired.value) {
    errorMsg.value = "Impossible de soumettre, la session est terminée.";
    loading.value = false;
    return;
  }

  if (!questionText.value.trim()) {
    errorMsg.value = "Merci de saisir votre question.";
    loading.value = false;
    return;
  }

  // 2. Vérifier la limite de 70 questions (Plan Gratuit)
  const reached = await checkIfLimitReached();
  if (reached) {
    analytics.trackEvent("question_limit_reached", {
      session_id: sessionId.value,
      slug: sessionSlug,
    });
    errorMsg.value = `This session has reached its limit of ${FREE_QUESTION_LIMIT} questions (Free Plan).`;
    loading.value = false;
    return;
  }

  const { error } = await supabase.from("questions").insert([
    {
      content: questionText.value.trim(),
      author_name: authorName.value.trim() || null,
      session_id: sessionId.value,
    },
  ]);

  loading.value = false;

  if (error) {
    errorMsg.value = error.message;
  } else {
    currentQuestionCount.value += 1;
    if (!isOwnerPremium.value && currentQuestionCount.value >= FREE_QUESTION_LIMIT) {
      limitReached.value = true;
    }

    analytics.trackEvent("question_submitted", {
      session_id: sessionId.value,
      slug: sessionSlug,
    });

    successMsg.value = "Your question was sent successfully!";
    questionText.value = "";
    authorName.value = "";

    setTimeout(() => {
      successMsg.value = "";
    }, 3000);
  }
};

onMounted(async () => {
  try {
    // 1. Tenter via la fonction RPC sécurisée si la migration SQL est active
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_public_session_status",
      { p_slug: sessionSlug }
    );

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      const status = rpcData[0];
      sessionExpiresAt.value = parseUTCDate(status.expires_at);
      isOwnerPremium.value = Boolean(status.is_owner_premium);
      currentQuestionCount.value = Number(status.question_count || 0);
      limitReached.value = Boolean(status.is_limit_reached);

      if (status.is_expired) {
        errorMsg.value = "This questions session is over";
        sessionExpired.value = true;
      } else {
        sessionId.value = status.session_id;
      }
      loadingPage.value = false;
      return;
    }

    // 2. Fallback direct sur les tables sessions / profiles / questions
    const { data: session, error } = await supabase
      .from("sessions")
      .select("id, expires_at, user_id, questions(count)")
      .eq("slug", sessionSlug)
      .single();

    if (error || !session) {
      errorMsg.value = "This session doesn't exist.";
      sessionExpired.value = true;
    } else {
      const expiresAt = parseUTCDate(session.expires_at);
      sessionExpiresAt.value = expiresAt;
      const now = new Date();

      if (expiresAt && now > expiresAt) {
        errorMsg.value = "This questions session is over";
        sessionExpired.value = true;
      } else {
        sessionId.value = session.id;
        currentQuestionCount.value = session.questions?.[0]?.count || 0;

        // Vérifier si l'organisateur est Pro
        if (session.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_premium, plan")
            .eq("id", session.user_id)
            .maybeSingle();

          if (profile) {
            isOwnerPremium.value =
              Boolean(profile.is_premium) ||
              ["pro", "premium", "premium_plus", "cancelled_pro"].includes(profile.plan);
          }
        }

        if (!isOwnerPremium.value && currentQuestionCount.value >= FREE_QUESTION_LIMIT) {
          limitReached.value = true;
        }
      }
    }
  } catch (err) {
    errorMsg.value = err.message || "Unable to load session.";
    sessionExpired.value = true;
  } finally {
    loadingPage.value = false;
  }
});

watch(sessionId, (newId) => {
  if (newId) {
    fileStore.fetchFiles(newId);
    fileStore.subscribeToFiles(newId);
    liveRoom.join();
  }
});

onUnmountedAsk(() => {
  fileStore.unsubscribeFromFiles();
});
</script>

<template>
  <AppLayout>
    <div class="h-screen sm:flex sm:items-center sm:justify-center max-sm:mt-[80px]">
      <div class="space-y-4 max-sm:w-full">
        <Teleport to="body">
          <!-- On enveloppe le message dans un composant Transition -->
          <Transition name="push-notification">
            <div
              v-if="successMsg"
              class="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-green-100 text-green-800 border border-green-600 px-6 py-3 rounded-[6px] flex items-center space-x-3 w-max"
            >
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
              <span class="text-[13px] font-medium w-full">{{ successMsg }}</span>
            </div>
          </Transition>
        </Teleport>
        <div v-if="loadingPage" class="text-center text-sm text-gray-500">
          Session verification ...
        </div>
        <div
          v-else-if="sessionExpired"
          class="text-center flex items-center justify-center flex-col"
        >
          <h1 class="text-[20px] font-semibold mb-8 text-red-500">Session ended</h1>
          <div class="flex flex-col items-center space-y-3">
            <svg
              class="oc-time-flies"
              width="100"
              height="50"
              viewBox="0 0 212 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M46.0605 133.709C28.6189 119.724 70.3254 112.613 93.3528 111.11C93.8201 111.079 94.2328 111.387 94.3684 111.835C101.29 134.713 118.865 143.998 126.92 146.225C107.649 148.145 63.7026 147.854 46.0605 133.709Z"
                fill="black"
              />
              <circle
                cx="144.404"
                cy="96.7561"
                r="46.2839"
                stroke="black"
                stroke-width="2"
              />
              <path
                d="M144.404 44.5117C173.258 44.5118 196.648 67.9023 196.648 96.7559C196.648 125.609 173.258 149 144.404 149C115.551 149 92.1602 125.609 92.1602 96.7559C92.1602 67.9023 115.551 44.5117 144.404 44.5117Z"
                stroke="black"
                stroke-width="2"
              />
              <ellipse cx="144.404" cy="57.8167" rx="2.38406" ry="2.38406" fill="black" />
              <ellipse cx="144.404" cy="135.695" rx="2.38406" ry="2.38406" fill="black" />
              <ellipse cx="183.344" cy="96.7552" rx="2.38406" ry="2.38406" fill="black" />
              <ellipse cx="105.464" cy="96.7552" rx="2.38406" ry="2.38406" fill="black" />
              <path
                d="M144.403 92.1924C147.143 92.1924 149.363 94.413 149.363 97.1523C149.363 99.8918 147.143 102.112 144.403 102.112C141.664 102.112 139.443 99.8917 139.443 97.1523C139.443 94.4131 141.664 92.1925 144.403 92.1924Z"
                stroke="black"
                stroke-width="2"
              />
              <path
                d="M124.537 97.1528H139.636"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M59.7693 59.6049C57.9812 59.34 53.968 58.5718 52.2197 57.6182"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M101.69 65.962C96.3255 66.4255 84.2462 66.5977 74.0742 62.7832"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M91.557 93.7759C77.8486 94.107 48.7233 93.4183 36.3262 88.8091"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M57.3856 107.881C43.5448 107.418 12.8036 105.497 0.56543 101.524"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M144.404 92.5841V66.5581"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M193.675 80.465C199.834 80.8623 212.549 84.2399 211.357 76.4916C210.773 72.6958 206.903 71.8502 204.583 71.8916C204.225 71.898 203.883 71.7414 203.665 71.4569C200.974 67.9428 194.625 62.9737 188.085 68.1445"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M119.57 27.3169C121.16 20.8269 128.908 9.794 147.186 17.5819L152.947 20.4661"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M147.186 17.5814C151.093 14.9324 160.695 12.0981 165.463 21.9522"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M111.425 27.9126H126.127"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M63.359 11.1423C62.813 7.74431 59.4919 5.09702 55.3974 5.09702C54.624 5.09702 53.8506 5.21555 53.1682 5.3736C51.0754 2.17315 47.1174 0 42.568 0C35.8348 0 30.4209 4.74141 30.4209 10.5496"
                stroke="black"
                stroke-width="2"
                stroke-miterlimit="10"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M63.3591 11.1422C68.227 11.6558 72.0031 15.2514 72.0031 19.6372C72.0031 24.3786 67.5901 28.2113 62.1307 28.2113L35.3344 28.1718H32.6047C27.1454 28.1718 22.7324 24.3391 22.7324 19.5977C22.7324 15.4885 26.0535 12.0905 30.4665 11.2212C32.4683 10.8129 37.691 10.0517 42.5681 10.2729M63.3591 11.2212C61.8729 10.971 57.9452 11.1817 54.1237 14.0266"
                stroke="black"
                stroke-width="2"
                stroke-miterlimit="10"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p v-if="errorMsg" class="text-gray-700 text-center text-sm">
              {{ errorMsg }}
            </p>
          </div>
        </div>

        <div v-else class="space-y-6 pb-24">
          <div>
            <h1 class="text-xxl font-semibold text-center mb-2">Ask your questions</h1>
            <p class="text-gray-700 text-center text-sm">You can ask the questions you want during the presentation</p>
          </div>

          <!-- Alerte d'erreur ou limite atteinte -->
          <div
            v-if="errorMsg"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[4px] text-xs text-center"
          >
            {{ errorMsg }}
          </div>

          <div
            v-else-if="limitReached"
            class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-[4px] text-xs text-center"
          >
            This session has reached the maximum of {{ FREE_QUESTION_LIMIT }} questions (Free Plan).
          </div>

          <!-- Section Documents (Participant) -->
          <div v-if="fileStore.files.length > 0" class="bg-gray-50 rounded-lg p-4 border border-gray-100">
             <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-[6px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M11.5186 13.633H8.54714C8.21609 13.633 7.90649 13.4692 7.72029 13.1954L7.2048 12.4376C7.01861 12.1638 6.70901 12 6.37795 12H4.51855C3.69013 12 3.01855 12.6716 3.01855 13.5V19.5C3.01855 20.3284 3.69013 21 4.51855 21H11.5186C12.347 21 13.0186 20.3284 13.0186 19.5V15.133C13.0186 14.3046 12.347 13.633 11.5186 13.633Z" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 21H17.5C18.8807 21 20 19.8807 20 18.5V8.37167C20 7.57602 19.6839 6.81296 19.1213 6.25035L16.7497 3.87868C16.187 3.31607 15.424 3 14.6283 3H7.5C6.11929 3 5 4.11929 5 5.5V9" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.9764 8H16.5C15.6716 8 15 7.32843 15 6.5V3.02362" stroke="#323232" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
                <span>Shared Documents</span>
             </h3>
             <FileList />
          </div>

          <form @submit.prevent="submitQuestion" class="space-y-6">
            <div class="space-y-2">
              <div>
                <textarea
                  v-model="questionText"
                  rows="4"
                  class="w-full py-2 px-3 border rounded outline-none text-sm resize-none disabled:bg-gray-50"
                  placeholder="Enter your question here..."
                  required
                  :disabled="loading || limitReached"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm mb-[6px] text-gray-500"
                  >Your name (optional) :</label
                >
                <input
                  v-model="authorName"
                  class="w-full p-2 border rounded disabled:bg-gray-50"
                  :disabled="loading || limitReached"
                />
              </div>
            </div>

            <button
              type="submit"
              class="w-full py-3 px-4 bg-[#E85D4A] text-white rounded-[4px] text-sm disabled:opacity-50"
              :disabled="loading || limitReached"
            >
              {{ loading ? "Submitting..." : limitReached ? "Question limit reached" : "Submit question" }}
            </button>
          </form>

          <!-- Badge viral sur les sessions gratuites -->
          <div v-if="!isOwnerPremium" class="pt-4 text-center">
            <a
              href="https://qalive.ink?utm_source=powered_by_badge"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F6F5EF] text-[11px] text-gray-600 hover:text-[#E85D4A] transition-colors"
            >
              <span>⚡ Powered by <strong>QALive</strong></span>
            </a>
          </div>

          <!-- Barre de réactions live fixe (Phase 1 — 0 écriture en base) -->
          <ReactionBar :disabled="sessionExpired" @react="handleAudienceReaction" />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style>
/* Animation d'entrée : la notification descend */
.push-notification-enter-active {
  animation: slide-down 0.5s ease-out;
}

/* Animation de sortie : la notification part vers la droite et disparaît */
.push-notification-leave-active {
  animation: slide-right-fade 0.7s ease-in;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translate(-50%, -100px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes slide-right-fade {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(
      100px,
      0
    ); /* La notification se déplace de 100px vers la droite en disparaissant */
  }
}
</style>
