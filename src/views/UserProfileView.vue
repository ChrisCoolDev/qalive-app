<script setup>
import BadgeComponent from "@/components/basis/BadgeComponent.vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { ref, computed, onMounted } from "vue";
import { formatDateLocal } from "@/utils/dateHelper";

const user = ref(null);
const userProfile = ref(null);
const sessionsCreatedCount = ref(0);

const authStore = useAuthStore();
const { logout } = authStore;

const isUserPremium = computed(() => {
  if (!userProfile.value) return false;
  return (
    Boolean(userProfile.value.is_premium) ||
    ["pro", "premium", "premium_plus", "cancelled_pro"].includes(userProfile.value.plan)
  );
});

const formattedPlanLabel = computed(() => {
  const plan = userProfile.value?.plan;
  if (!plan || plan === "basic") return isUserPremium.value ? "Pro" : "Basic (Free)";
  if (plan === "cancelled_pro") {
    const endStr = userProfile.value?.renews_at
      ? ` (active until ${formatDateLocal(userProfile.value.renews_at)})`
      : " (cancelled)";
    return `Pro${endStr}`;
  }
  return plan.replace("_", " ");
});

const fetchUserProfileAndUsage = async (userId) => {
  const [profileRes, sessionsCountRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_premium, plan, billing_portal_url, renews_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (profileRes.data) {
    userProfile.value = profileRes.data;
  }
  if (typeof sessionsCountRes.count === "number") {
    sessionsCreatedCount.value = sessionsCountRes.count;
  }
};

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null;
  if (user.value) {
    fetchUserProfileAndUsage(user.value.id);
  }
});

onMounted(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      user.value = session.user;
      fetchUserProfileAndUsage(session.user.id);
    }
  });
});

const handleLogout = async () => {
  const success = await logout();
  if (success) {
    window.location.href = `/login`;
  }
};

const redirectToEmailAddress = () => {
  window.location.href = "mailto:support@qalive.online";
};
</script>

<template>
  <div class="px-4">
    <div class="mx-auto max-w-xl mt-8" v-if="user && user.user_metadata">
      <div class="mb-6 flex items-center justify-between">
        <RouterLink
          to="/overview"
          class="inline-flex items-center space-x-1 text-[12px] text-gray-500 hover:text-primary transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to dashboard</span>
        </RouterLink>
      </div>

      <section class="flex items-end justify-between mb-8">
        <div class="flex space-x-1 items-center">
          <img
            :src="user.user_metadata.picture"
            alt="profile picture of connected user"
            class="w-9 h-9 rounded-[4px] mr-2 border border-[#E85D4A]"
          />
          <div class="space-y-1">
            <p class="leading-[100%] text-sm">
              {{ user.user_metadata.name }}
            </p>
            <p class="leading-[100%] text-[11px] text-gray-600">
              {{ user.user_metadata.email }}
            </p>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="text-[11px] text-red-700 leading-[100%] hover:underline"
        >
          Disconnect
        </button>
      </section>
      <div>
        <section>
          <h2 class="mb-3">Account</h2>
          <div
            class="border border-[#E6E6E6] rounded-[4px] w-full divide-y divide-[#E6E6E6]"
          >
            <div class="px-4 flex justify-between items-end py-4">
              <p class="text-[13px] text-gray-600">Username</p>
              <p class="text-[13px]">{{ user.user_metadata.name }}</p>
            </div>
            <div class="px-4 flex justify-between items-end py-4">
              <p class="text-[13px] text-gray-600">Email</p>
              <p class="text-[13px]">{{ user.user_metadata.email }}</p>
            </div>
          </div>
        </section>
        <section class="mt-5">
          <h2 class="mb-3">Appearance</h2>
          <div
            class="border border-[#E6E6E6] rounded-[4px] w-full divide-y divide-[#E6E6E6]"
          >
            <div class="px-4 flex justify-between items-end py-4">
              <div class="flex items-center space-x-2">
                <p class="text-[13px] text-gray-600">Language</p>
                <BadgeComponent badgeLabel="Coming soon" />
              </div>
              <p class="text-[13px]">En</p>
            </div>
            <div class="px-4 flex justify-between items-end py-4">
              <div class="flex items-center space-x-2">
                <p class="text-[13px] text-gray-600">Theme</p>
                <BadgeComponent badgeLabel="Coming soon" />
              </div>
              <p class="text-[13px]">Light</p>
            </div>
          </div>
        </section>

        <section class="mt-5">
          <h2 class="mb-3">Usage</h2>
          <div
            class="border border-[#E6E6E6] rounded-[4px] w-full divide-y divide-[#E6E6E6]"
          >
            <div class="px-4 flex justify-between items-end py-4">
              <p class="text-[13px] text-gray-600">Current Plan</p>
              <div class="flex flex-col items-end">
                <p class="text-[13px] capitalize">{{ formattedPlanLabel }}</p>

                <a
                  v-if="userProfile?.billing_portal_url"
                  :href="userProfile.billing_portal_url"
                  target="_blank"
                  class="text-[11px] text-[#E85D4A] hover:underline mt-1"
                >
                  Manage subscription
                </a>
              </div>
            </div>
            <div class="px-4 flex justify-between items-end py-4">
              <p class="text-[13px] text-gray-600">Sessions Created</p>
              <p class="text-[13px] text-gray-500">
                {{
                  isUserPremium
                    ? `${sessionsCreatedCount} (Unlimited)`
                    : `${sessionsCreatedCount} of 3`
                }}
              </p>
            </div>
          </div>
        </section>

        <section class="mt-5">
          <h2 class="mb-3">Support</h2>
          <div class="border border-[#E6E6E6] rounded-[4px] w-full">
            <div class="px-4 flex justify-between items-end py-4">
              <p class="text-[13px] text-gray-600 max-w-sm">
                Our app is currently under development. If you encounter any bugs or
                unexpected behavior, please don't hesitate to contact us. We appreciate
                your feedback and patience. Thank you!
              </p>
              <button
                class="text-[12px] py-1 px-2 rounded-[4px] bg-[#E85D4A] text-white"
                @click="redirectToEmailAddress"
              >
                Contact support
              </button>
            </div>
          </div>
        </section>
      </div>
      <div>
        <p class="text-center my-8 text-[12px] text-gray-500">Version 2.1.1</p>
      </div>
    </div>
  </div>
</template>
