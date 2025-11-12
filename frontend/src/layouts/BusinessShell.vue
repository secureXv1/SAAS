<template>
  <div class="min-h-screen flex flex-col">
    <!-- Topbar -->
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div class="container flex items-center justify-between py-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-blue-600 grid place-items-center text-white font-bold">N</div>
          <div class="font-semibold">Neura — Negocio</div>
        </div>
        <div class="flex items-center gap-2">
          <button class="md:hidden btn btn-primary" @click="open = !open">Menú</button>
          <button class="hidden md:inline-flex btn btn-secondary" @click="logout">Salir</button>
        </div>
      </div>
    </header>

    <div class="flex-1 flex">
      <!-- Sidebar desktop -->
      <aside class="hidden md:block w-64 border-r border-slate-200 bg-white">
        <nav class="p-4 space-y-1">
          <RouterLink to="/app/biz/dashboard" class="navlink">Dashboard</RouterLink>
          <RouterLink to="/app/biz/setup" class="navlink">Configuración del negocio</RouterLink>
          <RouterLink to="/app/biz/appointments" class="navlink">Citas</RouterLink>
          <RouterLink to="/app/biz/clients" class="navlink">Clientes</RouterLink>
          <RouterLink to="/app/biz/items" class="navlink">Productos / Servicios</RouterLink>
          <RouterLink to="/app/biz/sales" class="navlink">Ventas</RouterLink>
          <RouterLink to="/app/biz/expenses" class="navlink">Gastos</RouterLink>
          <RouterLink to="/app/biz/reports" class="navlink">Reportes</RouterLink>
          <RouterLink to="/app/biz/orders" class="navlink">Pedidos</RouterLink>
        </nav>
      </aside>

      <!-- Contenido -->
      <main class="flex-1">
        <!-- Sidebar móvil -->
        <div v-if="open" class="md:hidden border-b bg-white">
          <nav class="container p-2 grid gap-1">
            <RouterLink @click="open=false" to="/app/biz/dashboard" class="navlink">Dashboard</RouterLink>
            <RouterLink @click="open=false" to="/app/biz/setup" class="navlink">Configuración del negocio</RouterLink>
            <RouterLink @click="open=false" to="/app/biz/appointments" class="navlink">Citas</RouterLink>
            <RouterLink @click="open=false" to="/app/biz/clients" class="navlink">Clientes</RouterLink>
            <RouterLink @click="open=false" to="/app/biz/items" class="navlink">Productos / Servicios</RouterLink>
            <RouterLink @click="open=false" to="/app/biz/sales" class="navlink">Ventas</RouterLink>
            <RouterLink @click="open=false" to="/app/biz/expenses" class="navlink">Gastos</RouterLink>
            <RouterLink @click="open=false" to="/app/biz/reports" class="navlink">Reportes</RouterLink>
            <RouterLink @click="open=false" to="/app/biz/orders" class="navlink">Pedidos</RouterLink>
          </nav>
        </div>

        <div class="container py-6">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '@/stores/auth'
const open = ref(false)
const auth = useAuth()
function logout(){ auth.logout(); location.href='/login' }
</script>

<style scoped>
.navlink {
  @apply block rounded-lg px-3 py-2 text-sm hover:bg-slate-100;
}
</style>
