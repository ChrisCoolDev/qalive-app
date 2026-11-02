<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import WorldMapCard from '@/components/basis/WorldMapCard.vue'
import { supabase } from '@/lib/supabase'
import { analytics, isFounderEmail } from '@/lib/analytics'

const selectedDays = ref(7)
const loading = ref(true)
const authLoading = ref(true)
const currentUser = ref(null)
const copiedSql = ref(false)
const showSqlModal = ref(false)

const isAuthorizedFounder = computed(() => isFounderEmail(currentUser.value?.email))

const metrics = ref({
  dbTableReady: true,
  uniqueVisitors: 0,
  totalPageviews: 0,
  northStarSessions: 0,
  periodSessionsCreated: 0,
  periodQuestionsAsked: 0,
  activationRate: 0,
  proSubscribersCount: 0,
  estimatedMrr: 0,
  topPages: [],
  topSources: [],
  topCountries: [],
  deviceBreakdown: [],
  dailySeries: [],
  funnelEvents: [],
})

const periods = [
  { label: '24h', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
]

const maxDailyViews = computed(() => {
  if (!metrics.value.dailySeries.length) return 1
  return Math.max(...metrics.value.dailySeries.map((d) => d.views), 1)
})

async function loginAsFounder() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
}

async function logoutFounder() {
  await supabase.auth.signOut()
  currentUser.value = null
}

async function loadMetrics(days = selectedDays.value) {
  if (!isAuthorizedFounder.value) return
  selectedDays.value = days
  loading.value = true
  try {
    metrics.value = await analytics.fetchDashboardMetrics(days)
  } finally {
    loading.value = false
  }
}

const sqlSetupSnippet = `-- Tables Micro-Analytics Privées (analytic.qalive.online - Fondateur uniquement)
CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT DEFAULT 'Direct',
  utm_source TEXT,
  device_type TEXT DEFAULT 'Desktop',
  country_code TEXT DEFAULT 'XX',
  visitor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_page_views
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'XX';

CREATE INDEX IF NOT EXISTS idx_analytics_pv_created_at ON public.analytics_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_path ON public.analytics_page_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_country ON public.analytics_page_views(country_code);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_name TEXT NOT NULL,
  path TEXT,
  visitor_hash TEXT,
  user_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert page_views" ON public.analytics_page_views;
CREATE POLICY "Allow public insert page_views"
  ON public.analytics_page_views FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow founder select page_views" ON public.analytics_page_views;
CREATE POLICY "Allow founder select page_views"
  ON public.analytics_page_views FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('talchrist10@gmail.com', 'talchrist09@gmail.com'));

DROP POLICY IF EXISTS "Allow public insert analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public insert analytics_events"
  ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow founder select analytics_events" ON public.analytics_events;
CREATE POLICY "Allow founder select analytics_events"
  ON public.analytics_events FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('talchrist10@gmail.com', 'talchrist09@gmail.com'));`

async function copySqlToClipboard() {
  try {
    await navigator.clipboard.writeText(sqlSetupSnippet)
    copiedSql.value = true
    setTimeout(() => {
      copiedSql.value = false
    }, 2500)
  } catch {
    showSqlModal.value = true
  }
}

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  currentUser.value = session?.user ?? null
  authLoading.value = false

  if (isAuthorizedFounder.value) {
    loadMetrics(7)
  }

  supabase.auth.onAuthStateChange((_event, newSession) => {
    currentUser.value = newSession?.user ?? null
    if (isAuthorizedFounder.value) {
      loadMetrics(selectedDays.value)
    }
  })
})
</script>

<template>
  <AppLayout>
    <!-- 1. Chargement session -->
    <div v-if="authLoading" class="min-h-screen flex items-center justify-center text-sm text-gray-400">
      Verifying founder access...
    </div>

    <!-- 2. Non connecté : Écran de login dédié pour analytic.qalive.online -->
    <div v-else-if="!currentUser" class="min-h-screen flex items-center justify-center">
      <div class="max-w-sm w-full border border-[#E6E6E6] rounded-[6px] p-8 bg-white space-y-6 text-center">
        <div class="space-y-1">
          <span class="px-2.5 py-0.5 bg-[#F6F5EF] text-[#E85D4A] text-[10px] font-medium rounded-full">
            PRIVATE FOUNDER CONSOLE
          </span>
          <h1 class="text-xl font-semibold text-primary pt-2">analytic.qalive.online</h1>
          <p class="text-xs text-gray-500">Sign in with your founder Google account to view live metrics.</p>
        </div>

        <button
          @click="loginAsFounder"
          class="w-full flex items-center justify-center py-2.5 px-4 rounded-[4px] border border-gray-300 hover:border-primary text-[13px] font-medium space-x-2.5 transition-colors"
        >
          <img src="/logos/google.svg" alt="Google" class="w-4 h-4" />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>

    <!-- 3. Connecté mais avec un email non-fondateur : Accès refusé -->
    <div v-else-if="!isAuthorizedFounder" class="min-h-screen flex items-center justify-center">
      <div class="max-w-sm w-full border border-red-200 rounded-[6px] p-8 bg-red-50/40 space-y-4 text-center">
        <h1 class="text-base font-semibold text-red-700">403 — Restricted Access</h1>
        <p class="text-xs text-gray-600">
          The account <strong>{{ currentUser.email }}</strong> is not authorized to access this private console.
        </p>
        <button
          @click="logoutFounder"
          class="px-4 py-2 bg-primary text-white text-xs rounded-[4px]"
        >
          Sign out
        </button>
      </div>
    </div>

    <!-- 4. Dashboard Fondateur Privé -->
    <div v-else class="mt-[28px] mb-12 space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <h1 class="text-lg font-medium text-primary flex items-center gap-2">
              <span>analytic.qalive.online</span>
              <span
                class="px-2 py-0.5 bg-[#F6F5EF] border border-[#E6E6E6] text-gray-600 text-[10px] rounded-full"
              >
                Founder Only
              </span>
            </h1>
          </div>
          <p class="text-[13px] text-[#777]">
            Global traffic, North Star engagement & MRR across all QALive users.
          </p>
        </div>

        <div class="flex items-center space-x-3 self-start">
          <!-- Period selector -->
          <div class="flex items-center space-x-1 bg-[#F6F5EF] p-1 rounded-[4px] border border-[#E6E6E6]">
            <button
              v-for="p in periods"
              :key="p.days"
              @click="loadMetrics(p.days)"
              :class="[
                selectedDays === p.days
                  ? 'bg-white text-primary shadow-sm font-medium'
                  : 'text-gray-500 hover:text-primary',
                'px-3 py-1 rounded-[3px] text-[12px] transition-all',
              ]"
            >
              {{ p.label }}
            </button>
          </div>

          <button
            @click="logoutFounder"
            class="text-[11px] text-gray-400 hover:text-red-600 transition-colors"
            title="Disconnect"
          >
            Sign out
          </button>
        </div>
      </div>

      <!-- Bandeau si les tables SQL Supabase ne sont pas encore créées -->
      <div
        v-if="!metrics.dbTableReady && !loading"
        class="bg-[#F6F5EF] border border-[#E6E6E6] rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div class="space-y-0.5">
          <p class="text-[13px] font-medium text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[#E85D4A] text-[16px]">info</span>
            <span>Activez les tables SQL dans Supabase en 1 clic</span>
          </p>
          <p class="text-[12px] text-gray-500">
            Collez le script SQL dans votre Supabase SQL Editor pour enregistrer toutes les visites de
            <code>app.qalive.ink</code>.
          </p>
        </div>
        <div class="flex items-center space-x-2 shrink-0">
          <button
            @click="copySqlToClipboard"
            class="px-3 py-1.5 bg-[#E85D4A] text-white text-[12px] rounded-[4px] hover:bg-[#d44d3c] transition-colors"
          >
            {{ copiedSql ? '✓ SQL Copied!' : 'Copy SQL Setup' }}
          </button>
          <button
            @click="showSqlModal = !showSqlModal"
            class="px-2.5 py-1.5 bg-white border border-[#E6E6E6] text-gray-600 text-[12px] rounded-[4px] hover:border-gray-400"
          >
            {{ showSqlModal ? 'Hide SQL' : 'View SQL' }}
          </button>
        </div>
      </div>

      <!-- Bloc SQL dépliable -->
      <div v-if="showSqlModal" class="bg-gray-900 text-gray-100 p-4 rounded-[6px] text-xs overflow-x-auto">
        <pre class="font-mono leading-relaxed">{{ sqlSetupSnippet }}</pre>
      </div>

      <!-- 6 Cartes KPIs globales (Visiteurs, Pageviews, North Star, Activation, Questions, MRR) -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div class="p-4 rounded-[6px] border border-[#E6E6E6] bg-white space-y-1">
          <p class="text-[11px] uppercase tracking-wider text-gray-500">Unique Visitors</p>
          <p class="text-xl font-bold text-primary">{{ metrics.uniqueVisitors }}</p>
        </div>

        <div class="p-4 rounded-[6px] border border-[#E6E6E6] bg-white space-y-1">
          <p class="text-[11px] uppercase tracking-wider text-gray-500">Pageviews</p>
          <p class="text-xl font-bold text-primary">{{ metrics.totalPageviews }}</p>
        </div>

        <div class="p-4 rounded-[6px] border border-[#E85D4A]/40 bg-[#F6F5EF]/50 space-y-1">
          <p class="text-[11px] uppercase tracking-wider text-[#E85D4A] font-medium">
            ⭐ North Star (≥5 Qs)
          </p>
          <p class="text-xl font-bold text-primary">{{ metrics.northStarSessions }}</p>
        </div>

        <div class="p-4 rounded-[6px] border border-[#E6E6E6] bg-white space-y-1">
          <p class="text-[11px] uppercase tracking-wider text-gray-500">Activation</p>
          <p class="text-xl font-bold text-primary">{{ metrics.activationRate }}%</p>
        </div>

        <div class="p-4 rounded-[6px] border border-[#E6E6E6] bg-white space-y-1">
          <p class="text-[11px] uppercase tracking-wider text-gray-500">Questions</p>
          <p class="text-xl font-bold text-primary">{{ metrics.periodQuestionsAsked }}</p>
        </div>

        <div class="p-4 rounded-[6px] border border-[#E6E6E6] bg-white space-y-1">
          <p class="text-[11px] uppercase tracking-wider text-gray-500">Pro / MRR</p>
          <p class="text-xl font-bold text-primary">
            {{ metrics.proSubscribersCount }}
            <span class="text-xs font-normal text-gray-500">(${{ metrics.estimatedMrr }})</span>
          </p>
        </div>
      </div>

      <!-- Graphique d'évolution quotidienne minimaliste -->
      <div class="border border-[#E6E6E6] rounded-[6px] p-5 bg-white">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-medium text-primary">Daily Traffic</h2>
          <div class="flex items-center space-x-4 text-[11px] text-gray-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-sm bg-[#E85D4A] inline-block"></span>
              Pageviews
            </span>
          </div>
        </div>

        <div class="h-36 flex items-end gap-2 pt-4 border-b border-gray-100">
          <div
            v-for="day in metrics.dailySeries"
            :key="day.date"
            class="flex-1 flex flex-col items-center group relative h-full justify-end"
          >
            <div
              class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-primary text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none"
            >
              {{ day.label }}: {{ day.views }} views ({{ day.visitors }} uniq.)
            </div>

            <div
              class="w-full max-w-[32px] bg-[#E85D4A]/85 hover:bg-[#E85D4A] rounded-t-[3px] transition-all"
              :style="{
                height: `${Math.max((day.views / maxDailyViews) * 100, day.views > 0 ? 8 : 2)}%`,
              }"
            ></div>
          </div>
        </div>

        <div class="flex justify-between mt-2 text-[10px] text-gray-400">
          <span v-for="day in metrics.dailySeries" :key="day.date" class="flex-1 text-center truncate">
            {{ day.label }}
          </span>
        </div>
      </div>

      <!-- Carte du monde interactive & Classement des pays avec drapeaux -->
      <WorldMapCard :countries="metrics.topCountries" />

      <!-- Grille 2x2 style Plausible : Top Pages, Top Sources, Funnel, Devices -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Top Pages -->
        <div class="border border-[#E6E6E6] rounded-[6px] p-5 bg-white space-y-3">
          <div class="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-gray-100">
            <span class="font-medium text-primary text-sm">Top Pages</span>
            <span>Views</span>
          </div>

          <div v-if="metrics.topPages.length === 0" class="text-xs text-gray-400 py-6 text-center">
            No pageviews recorded for this period yet.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="page in metrics.topPages"
              :key="page.path"
              class="relative flex items-center justify-between px-2.5 py-1.5 rounded text-[13px] overflow-hidden"
            >
              <div
                class="absolute inset-y-0 left-0 bg-[#F6F5EF] transition-all"
                :style="{ width: `${Math.max(page.pct, 4)}%` }"
              ></div>
              <span class="relative z-10 truncate font-mono text-[12px] text-primary max-w-[75%]">
                {{ page.path }}
              </span>
              <span class="relative z-10 text-xs font-medium text-gray-600">
                {{ page.views }}
              </span>
            </div>
          </div>
        </div>

        <!-- Top Sources -->
        <div class="border border-[#E6E6E6] rounded-[6px] p-5 bg-white space-y-3">
          <div class="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-gray-100">
            <span class="font-medium text-primary text-sm">Top Sources</span>
            <span>Visitors</span>
          </div>

          <div v-if="metrics.topSources.length === 0" class="text-xs text-gray-400 py-6 text-center">
            No traffic sources recorded yet.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="src in metrics.topSources"
              :key="src.source"
              class="relative flex items-center justify-between px-2.5 py-1.5 rounded text-[13px] overflow-hidden"
            >
              <div
                class="absolute inset-y-0 left-0 bg-[#F6F5EF] transition-all"
                :style="{ width: `${Math.max(src.pct, 4)}%` }"
              ></div>
              <span class="relative z-10 truncate text-[13px] text-primary">
                {{ src.source }}
              </span>
              <span class="relative z-10 text-xs font-medium text-gray-600">
                {{ src.visitors }}
              </span>
            </div>
          </div>
        </div>

        <!-- Product Funnel & Custom Events -->
        <div class="border border-[#E6E6E6] rounded-[6px] p-5 bg-white space-y-3">
          <div class="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-gray-100">
            <span class="font-medium text-primary text-sm">Conversion Funnel</span>
            <span>Count</span>
          </div>

          <div class="space-y-2">
            <div
              v-for="ev in metrics.funnelEvents"
              :key="ev.name"
              class="flex items-center justify-between px-2.5 py-1.5 rounded bg-gray-50/70 text-[13px]"
            >
              <span class="text-gray-700">{{ ev.label }}</span>
              <span class="text-xs font-semibold text-primary px-2 py-0.5 bg-white rounded border border-gray-200">
                {{ ev.count }}
              </span>
            </div>
          </div>
        </div>

        <!-- Devices -->
        <div class="border border-[#E6E6E6] rounded-[6px] p-5 bg-white space-y-3">
          <div class="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-gray-100">
            <span class="font-medium text-primary text-sm">Devices</span>
            <span>Share</span>
          </div>

          <div class="space-y-3 pt-1">
            <div v-for="dev in metrics.deviceBreakdown" :key="dev.device" class="space-y-1">
              <div class="flex justify-between text-[13px]">
                <span class="text-gray-700">{{ dev.device }}</span>
                <span class="text-gray-500 text-xs">{{ dev.pct }}% ({{ dev.count }})</span>
              </div>
              <div class="w-full h-2 bg-[#F6F5EF] rounded-full overflow-hidden">
                <div
                  class="h-full bg-[#E85D4A] rounded-full transition-all"
                  :style="{ width: `${dev.pct}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
