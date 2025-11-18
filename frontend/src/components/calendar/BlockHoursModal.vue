<template>
  <div class="fixed inset-0 bg-black/40 grid place-items-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-[95vw] max-w-md p-4 sm:p-6">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">
          {{ initial && initial.id ? 'Editar bloqueo' : 'Bloquear horario' }}
        </h3>
        <button class="text-slate-500" @click="emit('close')">✕</button>
      </div>

      <form class="grid gap-3 mt-3" @submit.prevent="save">
        <label class="grid gap-1">
        <span class="text-sm">Motivo <span class="text-slate-400">(opcional)</span></span>
        <input
          v-model.trim="form.reason"
          class="border rounded-lg px-3 py-2"
          placeholder="Opcional: almuerzo, reunión, etc."
        />
      </label>

        <!-- Muestra el rango ya fijado -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="grid gap-1">
            <span class="text-sm">Inicio</span>
            <input
              type="datetime-local"
              v-model="form.start_at"
              class="border rounded-lg px-3 py-2 bg-slate-100 text-slate-600"
              :readonly="true"
            />
          </label>
          <label class="grid gap-1">
            <span class="text-sm">Fin</span>
            <input
              type="datetime-local"
              v-model="form.end_at"
              class="border rounded-lg px-3 py-2 bg-slate-100 text-slate-600"
              :readonly="true"
            />
          </label>
        </div>

        <p class="text-[11px] text-slate-400">
          El horario se toma de la hora que seleccionaste en la agenda.
        </p>

        <div class="flex items-center justify-end gap-2 mt-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-3 py-1.5 rounded-lg bg-amber-600 text-white"
          >
            Guardar bloqueo
          </button>
        </div>

        <div
          v-if="initial && initial.id"
          class="mt-4 pt-3 border-t flex justify-end"
        >
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm"
            @click="deleteBlock"
          >
            Eliminar bloqueo
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, watch } from 'vue'
import http from '@/api/http'

const props = defineProps({
  // viene desde Appointments.vue -> blockInitial
  initial: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const form = reactive({
  reason: '',
  start_at: '',
  end_at: ''
})

function loadFromInitial() {
  if (!props.initial) return
  form.reason   = props.initial.reason || ''
  // vienen como '2025-11-18T14:30' desde el slot
  form.start_at = props.initial.start_at || ''
  form.end_at   = props.initial.end_at   || ''
}

onMounted(loadFromInitial)
watch(() => props.initial, loadFromInitial)

async function save() {
    if (!form.start_at || !form.end_at) {
    alert('Fechas inválidas')
    return
  }


  const payload = { ...form }

  // Tu backend solo tiene POST/DELETE, así que para "editar" recreamos el bloqueo
  if (props.initial && props.initial.id) {
    try {
      await http.delete(`/business/appointment-blocks/${props.initial.id}`)
    } catch (e) {
      console.warn('Error eliminando bloqueo previo (puede no existir):', e?.message)
    }
  }

  await http.post('/business/appointment-blocks', payload)
  emit('close')
}

async function deleteBlock() {
  if (!props.initial?.id) return
  if (!confirm('¿Eliminar este bloqueo de horario?')) return
  await http.delete(`/business/appointment-blocks/${props.initial.id}`)
  emit('close')
}
</script>
