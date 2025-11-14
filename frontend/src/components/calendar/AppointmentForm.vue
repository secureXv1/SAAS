<template>
  <div class="fixed inset-0 bg-black/40 grid place-items-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-[95vw] max-w-xl p-4 sm:p-6">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">{{ initial ? 'Editar cita' : 'Nueva cita' }}</h3>
        <button class="text-slate-500" @click="$emit('close')">✕</button>
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
          <input v-model.trim="form.title" class="border rounded-lg px-3 py-2" placeholder="Ej. Corte de cabello" />
        </label>

        <label class="grid gap-1">
          <span class="text-sm">Notas</span>
          <textarea v-model.trim="form.notes" rows="2" class="border rounded-lg px-3 py-2"></textarea>
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
          <input type="checkbox" v-model="form.is_domicile" class="accent-sky-500"> Cita a domicilio
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
          <button type="button" class="px-3 py-1.5 rounded-lg border" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'
import http from '@/api/http'

const props = defineProps({ initial: { type: Object, default: null } })
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

onMounted(async () => {
  const { data } = await http.get('/business/clients')
  clients.value = data.items || []
  if (props.initial) {
    Object.assign(form, {
      client_id: props.initial.client_id,
      title: props.initial.title,
      notes: props.initial.notes,
      is_domicile: !!props.initial.is_domicile,
      domicile_addr: props.initial.domicile_addr,
      domicile_phone: props.initial.domicile_phone,
      start_at: props.initial.start_at?.slice(0,16),
      end_at:   props.initial.end_at?.slice(0,16)
    })
  }
})

async function save() {
  if (!form.client_id || !form.title || !form.start_at || !form.end_at) {
    alert('Completa los campos obligatorios')
    return
  }
  if (props.initial) await http.patch(`/business/appointments/${props.initial.id}`, form)
  else await http.post('/business/appointments', form)
  emitClose()
}

function emitClose(){
  // Notificar al padre; Appointments.vue escucha @close en el componente
  // Como estamos en <script setup>, basta con emitir un evento nativo:
  // (Uso alterno por compatibilidad de tu código actual)
  const e = new CustomEvent('close')
  window.dispatchEvent(e)
  // y también emitir el evento del componente:
  // (lo hace el template en el botón de cerrar)
}
</script>
