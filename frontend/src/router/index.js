import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/auth'

// Páginas públicas
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import NotFound from '@/pages/NotFound.vue'

// Business
import BizShell from '@/layouts/BusinessShell.vue'
import BizDashboard from '@/pages/business/Dashboard.vue'
import BizSetup from '@/pages/business/Setup.vue'
import BizAppointments from '@/pages/business/Appointments.vue'
import BizClients from '@/pages/business/Clients.vue'
import BizItems from '@/pages/business/Items.vue'
import BizSales from '@/pages/business/Sales.vue'
import BizExpenses from '@/pages/business/Expenses.vue'
import BizReports from '@/pages/business/Reports.vue'
import BizOrders from '@/pages/business/Orders.vue'

// (Podemos agregar luego AdminShell y ClientShell)
export const resolveHomeByRole = (role) => {
  if (role === 'business') return '/app/biz/dashboard'
  if (role === 'admin')    return '/app/biz/dashboard' // temporal hasta crear Admin
  if (role === 'client')   return '/app/biz/dashboard' // temporal hasta crear Client
  return '/login'
}

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/register', component: Register, meta: { public: true } },

  // ----- BUSINESS -----
  {
    path: '/app/biz',
    component: BizShell,
    meta: { roles: ['business'] },
    children: [
      { path: 'dashboard',    component: BizDashboard,    meta: { roles: ['business'] } },
      { path: 'setup',        component: BizSetup,        meta: { roles: ['business'] } },
      { path: 'appointments', component: BizAppointments, meta: { roles: ['business'] } },
      { path: 'clients',      component: BizClients,      meta: { roles: ['business'] } },
      { path: 'items',        component: BizItems,        meta: { roles: ['business'] } },
      { path: 'sales',        component: BizSales,        meta: { roles: ['business'] } },
      { path: 'expenses',     component: BizExpenses,     meta: { roles: ['business'] } },
      { path: 'reports',      component: BizReports,      meta: { roles: ['business'] } },
      { path: 'orders',       component: BizOrders,       meta: { roles: ['business'] } },
      { path: '', redirect: '/app/biz/dashboard' }
    ]
  },

  { path: '/:pathMatch(.*)*', component: NotFound, meta: { public: true } }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuth()
  if (to.meta.public) return true
  if (!auth.isLogged) return '/login'
  if (to.meta?.roles?.length && !to.meta.roles.includes(auth.role)) {
    return resolveHomeByRole(auth.role)
  }
})
