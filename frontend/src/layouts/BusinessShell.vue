<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- HEADER FIJO -->
    <header class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 h-14">
      <div class="h-full px-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-blue-600 grid place-items-center text-white font-bold">N</div>
          <div class="font-semibold text-slate-800">Neura — Negocio</div>
        </div>
        <div class="flex items-center gap-2">
          <button class="md:hidden btn btn-primary" @click="open = !open">Menú</button>
          <button class="hidden md:inline-flex btn btn-secondary" @click="logout">Cerrar sesión</button>
        </div>
      </div>
    </header>

    <!-- BODY (compensa header con pt-14) -->
    <div class="flex-1 flex pt-14">
      <!-- SIDEBAR DESKTOP -->
      <aside
        class="hidden md:block w-64 bg-white border-r border-slate-200
               sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <nav class="p-4 space-y-1">
          <RouterLink to="/app/biz/dashboard"    class="navlink" :class="isActive('/app/biz/dashboard')">Dashboard</RouterLink>
          <RouterLink to="/app/biz/setup"        class="navlink" :class="isActive('/app/biz/setup')">Configuración del negocio</RouterLink>
          <RouterLink to="/app/biz/appointments" class="navlink" :class="isActive('/app/biz/appointments')">Citas</RouterLink>
          <RouterLink to="/app/biz/clients"      class="navlink" :class="isActive('/app/biz/clients')">Clientes</RouterLink>
          <RouterLink to="/app/biz/items"        class="navlink" :class="isActive('/app/biz/items')">Productos / Servicios</RouterLink>
          <RouterLink to="/app/biz/sales"        class="navlink" :class="isActive('/app/biz/sales')">Ventas</RouterLink>
          <RouterLink to="/app/biz/expenses"     class="navlink" :class="isActive('/app/biz/expenses')">Gastos</RouterLink>
          <RouterLink to="/app/biz/reports"      class="navlink" :class="isActive('/app/biz/reports')">Reportes</RouterLink>
          <RouterLink to="/app/biz/orders"       class="navlink" :class="isActive('/app/biz/orders')">Pedidos</RouterLink>
        </nav>
      </aside>

      <!-- CONTENIDO -->
      <main class="flex-1">
        <!-- MENÚ MÓVIL desplegable bajo el header -->
        <div v-if="open" class="md:hidden border-b bg-white">
          <nav class="px-4 py-2 grid gap-1">
            <RouterLink @click="closeMenu" to="/app/biz/dashboard"    class="navlink">Dashboard</RouterLink>
            <RouterLink @click="closeMenu" to="/app/biz/setup"        class="navlink">Configuración del negocio</RouterLink>
            <RouterLink @click="closeMenu" to="/app/biz/appointments" class="navlink">Citas</RouterLink>
            <RouterLink @click="closeMenu" to="/app/biz/clients"      class="navlink">Clientes</RouterLink>
            <RouterLink @click="closeMenu" to="/app/biz/items"        class="navlink">Productos / Servicios</RouterLink>
            <RouterLink @click="closeMenu" to="/app/biz/sales"        class="navlink">Ventas</RouterLink>
            <RouterLink @click="closeMenu" to="/app/biz/expenses"     class="navlink">Gastos</RouterLink>
            <RouterLink @click="closeMenu" to="/app/biz/reports"      class="navlink">Reportes</RouterLink>
            <RouterLink @click="closeMenu" to="/app/biz/orders"       class="navlink">Pedidos</RouterLink>
          </nav>
        </div>

        <!-- Contenedor del contenido -->
        <div class="container px-4 py-6">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'
const open = ref(false)
const auth = useAuth()
const route = useRoute()

function logout(){ auth.logout(); location.href='/login' }
function closeMenu(){ open.value = false }
function isActive(prefix){ return route.path.startsWith(prefix) ? 'navlink--active' : '' }
</script>

<style scoped>
.navlink { @apply block rounded-lg px-3 py-2 text-sm hover:bg-slate-100 text-slate-700; }
.navlink--active { @apply bg-slate-100 font-semibold; }
</style>
