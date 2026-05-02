import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: () => import('@/views/Home.vue') },
    { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { guest: true } },
    { path: '/register', name: 'Register', component: () => import('@/views/Register.vue'), meta: { guest: true } },
    {
      path: '/investigators',
      name: 'Investigators',
      component: () => import('@/views/Investigators.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/investigator/new',
      name: 'InvestigatorCreate',
      component: () => import('@/views/InvestigatorCreate.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/investigator/:id',
      name: 'InvestigatorDetail',
      component: () => import('@/views/InvestigatorDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/campaigns',
      name: 'Campaigns',
      component: () => import('@/views/Campaigns.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    next('/login')
  } else if (to.meta.guest && auth.token) {
    next('/')
  } else {
    next()
  }
})

export default router
