import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import HomeView from '../views/HomeView.vue'
import QuestionsView from '@/views/QuestionsView.vue'
import CreateSessionView from '@/views/CreateSessionView.vue'
import LoginView from '@/views/LoginView.vue'
import AskQuestionView from '@/views/AskQuestionView.vue'
import SessionQRCodeView from '@/views/SessionQRCodeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: '/:pathMatch(.*)*',
      redirect: '/overview',
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next({ name: 'login' })
  } else if (to.name === 'login' && session) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
