<template>
  <div class="fixed inset-0 bg-black/40 grid place-items-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-[95vw] max-w-md p-4 sm:p-6">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Bloquear horario</h3>
        <button class="text-slate-500" @click="$emit('close')">✕</button>
      </div>

      <form class="grid gap-3 mt-3" @submit.prevent="save">
        <label class="grid gap-1">
          <span class="text-sm">Motivo</span>
          <input v-model.trim="form.reason" class="border rounded-lg px-3 py-2" placeholder="Almuerzo, reunión, etc." />
        </label>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="grid gap-1">
            <span class="text-sm">Inicio</span>
            <input type="datetime-local" v-model="form.start_at" class="border rounded-lg px-3 py-2" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm">Fin</span>
            <input type="datetime-local" v-model="form.end_at" class="border rounded-lg px-3 py-2" />
          </label>
        </div>

        <div class="flex items-center justify-end gap-2 mt-2">
          <button type="button" class="px-3 py-1.5 rounded-lg border" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="px-3 py-1.5 rounded-lg bg-amber-600 text-white">Bloquear</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import http from '@/api/http'

const form = reactive({ reason:'', start_at:'', end_at:'' })

async function save(){
  if (!form.reason || !form.start_at || !form.end_at) {
    alert('Completa los campos')
    return
  }
  await http.post('/business/appointment-blocks', form)
  const e = new CustomEvent('close')
  window.dispatchEvent(e)
}
</script>
