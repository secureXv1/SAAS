import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/auth'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Dashboard from '@/pages/Dashboard.vue'
import NotFound from '@/pages/NotFound.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/register', component: Register, meta: { public: true } },
  { path: '/app/dashboard', component: Dashboard },
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { public: true } }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuth()
  if (!to.meta.public && !auth.isLogged) return '/login'
})
