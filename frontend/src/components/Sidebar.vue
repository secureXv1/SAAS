<template>
  <aside class="p-4 space-y-2">
    <RouterLink to="/app/dashboard" class="block rounded-lg px-3 py-2 hover:bg-slate-100">Dashboard</RouterLink>
    <!-- Próximas rutas:
    <RouterLink to="/app/calendar" class="block rounded-lg px-3 py-2 hover:bg-slate-100">Citas</RouterLink>
    <RouterLink to="/app/clients" class="block rounded-lg px-3 py-2 hover:bg-slate-100">Clientes</RouterLink>
    <RouterLink to="/app/items" class="block rounded-lg px-3 py-2 hover:bg-slate-100">Productos/Servicios</RouterLink>
    <RouterLink to="/app/sales" class="block rounded-lg px-3 py-2 hover:bg-slate-100">Ventas</RouterLink>
    <RouterLink to="/app/expenses" class="block rounded-lg px-3 py-2 hover:bg-slate-100">Gastos</RouterLink>
    <RouterLink to="/app/reports" class="block rounded-lg px-3 py-2 hover:bg-slate-100">Reportes</RouterLink>
    -->
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
