<template>
  <header class="w-full sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
    <div class="container flex items-center justify-between py-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-blue-600 grid place-items-center text-white font-bold">N</div>
        <span class="font-semibold">Neura</span>
      </div>
      <div class="flex items-center gap-3">
        <button v-if="user" class="btn btn-secondary hidden sm:inline-flex" @click="$emit('logout')">Cerrar sesión</button>
        <!-- Menú hamburguesa para móvil -->
        <button class="md:hidden btn btn-primary" @click="open = !open">Menú</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
defineProps({ user: Object })
const open = ref(false)
</script>
