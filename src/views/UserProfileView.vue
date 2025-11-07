<script setup>
import BadgeComponent from "@/components/basis/BadgeComponent.vue";
import { supabase } from "@/lib/supabase";
import { useAuthSotre } from "@/stores/authStore";
import { ref } from "vue";

const user = ref(null);

const authStore = useAuthSotre();

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null;
});

const { logout } = authStore;

const handleLogout = async () => {
  const success = await logout();
  if (success) {
    window.location.href = `/login`;
  }
};
</script>

<template>
  <div class="px-4">
    <div class="mx-auto max-w-xl mt-8" v-if="user && user.user_metadata">
      <section class="flex items-end justify-between mb-8">
        <div class="flex space-x-1 items-center">
          <img
            :src="user.user_metadata.picture"
            alt="profile picture of connected user"
            class="w-9 h-9 rounded-full border border-[#7738C7] mr-2"
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
        <button @click="handleLogout" class="text-[11px] text-red-700 leading-[100%]">
          Disconnect
        </button>
      </section>
      <div>
        <section>
          <h2 class="mb-3">Account</h2>
          <div
            class="border border-[#C8C8C8] rounded-[4px] w-full divide-y divide-[#C8C8C8]"
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
            class="border border-[#C8C8C8] rounded-[4px] w-full divide-y divide-[#C8C8C8]"
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
            class="border border-[#C8C8C8] rounded-[4px] w-full divide-y divide-[#C8C8C8]"
          >
            <div class="px-4 flex justify-between items-end py-4">
              <p class="text-[13px] text-gray-600">Current Plan</p>
              <p class="text-[13px]">Basic</p>
            </div>
            <div class="px-4 flex justify-between items-end py-4">
              <p class="text-[13px] text-gray-600">Session Created</p>
              <p class="text-[13px] text-gray-500">1 of 1</p>
            </div>
          </div>
        </section>
        <section class="mt-5">
          <h2 class="mb-3">Delete Account</h2>
          <div class="border border-[#C8C8C8] rounded-[4px] w-full">
            <div class="px-4 flex justify-between items-end py-4">
              <p class="text-[13px] text-gray-600 max-w-sm">
                Permanently delete your account and all its associeted data, this action
                cannot be undone.
              </p>
              <button
                class="text-[12px] py-1 px-2 border border-red-800 rounded-[4px] bg-red-700 text-white"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>
      <div>
        <p class="text-center my-8 text-[12px] text-gray-500">Version 1.0.1</p>
      </div>
    </div>
  </div>
</template>
