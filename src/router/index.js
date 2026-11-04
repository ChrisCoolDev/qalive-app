import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { analytics, isAnalyticsSubdomain, isFounderEmail } from '@/lib/analytics'
import { cleanAuthUrl } from '@/utils/urlHelper'
import HomeView from '../views/HomeView.vue'
import QuestionsView from '@/views/QuestionsView.vue'
import CreateSessionView from '@/views/CreateSessionView.vue'
import LoginView from '@/views/LoginView.vue'
import AskQuestionView from '@/views/AskQuestionView.vue'
import SessionQRCodeView from '@/views/SessionQRCodeView.vue'
import StageView from '@/views/StageView.vue'
import UserProfileView from '@/views/UserProfileView.vue'
import AnalyticsView from '@/views/AnalyticsView.vue'

// Si le domaine est analytic.qalive.online (ou ?app=analytic en local),
// l'application sert exclusivement l'outil d'analytics privé du fondateur.
const onAnalyticsDomain = isAnalyticsSubdomain()

const routes = onAnalyticsDomain
  ? [
      {
        path: '/',
        name: 'FounderAnalyticsRoot',
        component: AnalyticsView,
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: '/',
      },
    ]
  : [
      {
        path: '/login',
        name: 'login',
        component: LoginView,
      },
      {
        path: '/ask/:slug',
        name: 'AskQuestion',
        component: AskQuestionView,
      },
      {
        path: '/profile',
        name: 'UserProfile',
        component: UserProfileView,
        meta: { requiresAuth: true },
      },
      {
        path: '/overview',
        name: 'home',
        component: HomeView,
        meta: { requiresAuth: true },
      },
      {
        path: '/create-session',
        name: 'createSession',
        component: CreateSessionView,
        meta: { requiresAuth: true },
      },
      {
        path: '/session/:slug',
        name: 'session',
        component: QuestionsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/session/:slug/qrcode',
        name: 'SessionQRCode',
        component: SessionQRCodeView,
        meta: { requiresAuth: true },
      },
      {
        path: '/stage/:slug',
        name: 'StageView',
        component: StageView,
        meta: { requiresAuth: true },
      },
      // Route locale secrète réservée uniquement à l'email du fondateur pour tester en dev
      {
        path: '/analytics',
        name: 'Analytics',
        component: AnalyticsView,
        meta: { requiresAuth: true, requiresFounder: true },
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: '/overview',
      },
    ]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  // Sur analytic.qalive.online, AnalyticsView gère lui-même son écran de connexion fondateur
  if (onAnalyticsDomain) {
    cleanAuthUrl()
    return next()
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Nettoie l'URL dès que Supabase a lu les tokens OAuth
  if (session) {
    cleanAuthUrl()
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresFounder = to.matched.some((record) => record.meta.requiresFounder)

  if (requiresAuth && !session) {
    next({ name: 'login' })
  } else if (requiresFounder && !isFounderEmail(session?.user?.email)) {
    next({ name: 'home' })
  } else if (to.name === 'login' && session) {
    next({ name: 'home' })
  } else {
    next()
  }
})

router.afterEach((to) => {
  if (!onAnalyticsDomain) {
    analytics.trackPageView(to.path)
  }
})

export default router
