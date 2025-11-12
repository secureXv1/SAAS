<template>
  <div class="min-h-screen flex flex-col">
    <Topbar :user="auth.user" @logout="onLogout" />

    <div class="flex-1 flex">
      <!-- Sidebar desktop -->
      <Sidebar class="hidden md:block w-64 border-r border-slate-200 bg-white" />

      <!-- Contenido -->
      <main class="flex-1">
        <div class="container py-6">
          <router-view />
        </div>
      </main>
    </div>

    <footer class="text-center py-4 text-xs text-slate-500">
      Neura SaaS © {{ year }}
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Topbar from '@/components/Topbar.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useAuth } from '@/stores/auth'
const auth = useAuth()
const year = computed(() => new Date().getFullYear())
function onLogout(){ auth.logout(); location.href='/login' }
</script>
