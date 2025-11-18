<template>
  <div class="fixed inset-0 bg-black/40 grid place-items-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-[95vw] max-w-xl p-4 sm:p-6">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">
          {{ initial && initial.id ? 'Editar cita' : 'Nueva cita' }}
        </h3>
        <button class="text-slate-500" @click="emit('close')">✕</button>
      </div>

      <form class="grid gap-3 mt-3" @submit.prevent="save">
        <label class="grid gap-1">
          <span class="text-sm">Cliente</span>
          <select v-model.number="form.client_id" class="border rounded-lg px-3 py-2">
            <option :value="c.id" v-for="c in clients" :key="c.id">
              {{ c.full_name }} • {{ c.phone || 's/teléfono' }}
            </option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-sm">Título</span>
          <input
            v-model.trim="form.title"
            class="border rounded-lg px-3 py-2"
            placeholder="Ej. Corte de cabello"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm">Notas</span>
          <textarea v-model.trim="form.notes" rows="2" class="border rounded-lg px-3 py-2" />
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

        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="form.is_domicile" class="accent-sky-500" />
          Cita a domicilio
        </label>

        <div v-if="form.is_domicile" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="grid gap-1">
            <span class="text-sm">Dirección</span>
            <input v-model="form.domicile_addr" class="border rounded-lg px-3 py-2" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm">Teléfono</span>
            <input v-model="form.domicile_phone" class="border rounded-lg px-3 py-2" />
          </label>
        </div>

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
            class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
          >
            Guardar
          </button>
        </div>

        <!-- Acciones extra si es cita existente -->
        <div
          v-if="initial && initial.id"
          class="mt-4 pt-3 border-t flex flex-col sm:flex-row gap-2 justify-between"
        >
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm"
            @click="cancelAppointment"
          >
            Cancelar cita
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm"
            @click="blockFromAppointment"
          >
            Bloquear este horario
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, watch } from 'vue'
import http from '@/api/http'

const props = defineProps({
  initial: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const clients = ref([])

const form = reactive({
  client_id: null,
  title: '',
  notes: '',
  is_domicile: false,
  domicile_addr: '',
  domicile_phone: '',
  start_at: '',
  end_at: ''
})

function loadFromInitial() {
  if (!props.initial) return
  form.client_id = props.initial.client_id ?? null
  form.title = props.initial.title || ''
  form.notes = props.initial.notes || ''
  form.is_domicile = !!props.initial.is_domicile
  form.domicile_addr = props.initial.domicile_addr || ''
  form.domicile_phone = props.initial.domicile_phone || ''
  // Si vienen como ISO, corto a yyyy-MM-ddTHH:mm
  if (props.initial.start_at) form.start_at = props.initial.start_at.slice(0, 16)
  if (props.initial.end_at)   form.end_at   = props.initial.end_at.slice(0, 16)
}

onMounted(async () => {
  const { data } = await http.get('/business/clients')
  clients.value = data.items || []
  if (!form.client_id && clients.value.length) {
    form.client_id = clients.value[0].id
  }
  loadFromInitial()
})

watch(() => props.initial, loadFromInitial)

async function save() {
  if (!form.client_id || !form.title || !form.start_at || !form.end_at) {
    alert('Completa los campos obligatorios')
    return
  }

  const payload = {
    ...form,
    is_domicile: form.is_domicile ? 1 : 0
  }

  if (props.initial && props.initial.id) {
    await http.patch(`/business/appointments/${props.initial.id}`, payload)
  } else {
    await http.post('/business/appointments', payload)
  }

  emit('close')
}

async function cancelAppointment() {
  if (!props.initial?.id) return
  if (!confirm('¿Seguro que deseas cancelar/eliminar esta cita?')) return
  await http.delete(`/business/appointments/${props.initial.id}`)
  emit('close')
}

async function blockFromAppointment() {
  if (!props.initial) return
  const reason = prompt('Motivo del bloqueo (ej. Reserva / descanso / bloqueo manual):', 'Bloqueo desde cita')
  if (!reason) return

  await http.post('/business/appointment-blocks', {
    reason,
    start_at: form.start_at,
    end_at: form.end_at
  })

  // Opcional: cancelar la cita original
  const cancelar = confirm('¿También deseas cancelar la cita original?')
  if (cancelar && props.initial.id) {
    await http.delete(`/business/appointments/${props.initial.id}`)
  }

  emit('close')
}
</script>
