<template>
  <div class="min-h-screen bg-slate-50">
    <!-- HERO / Filtros -->
    <div class="bg-gradient-to-r from-slate-800 to-slate-700">
      <div class="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 class="text-white text-2xl font-semibold">Agenda</h1>
          <p class="text-slate-300 text-sm">Gestiona tus citas y bloqueos</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="date"
            v-model="uiDate"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
          />
          <select v-model="viewMode" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white">
            <option value="week">Semana</option>
            <option value="day">Día</option>
          </select>
          <input
            v-model.trim="q"
            placeholder="Buscar (cliente/título/teléfono)"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white w-64"
          />
          <label class="flex items-center gap-2 text-slate-200 text-sm">
            <input type="checkbox" v-model="onlyDomicile" class="accent-sky-400"> Domicilio
          </label>
          <button @click="openNew" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm">
            Nueva cita
          </button>
          <button @click="openBlock" class="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm">
            Bloquear
          </button>
        </div>
      </div>
    </div>

    <!-- Calendario -->
    <div class="max-w-[1300px] mx-auto px-2 sm:px-4 -mt-4 pb-10">
      <CalendarGrid
        :date="currentDate"
        :mode="viewMode"
        :events="displayEvents"
        :blocks="blocks"
        :startHour="startHour"
        :endHour="endHour"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>

    <!-- Modales -->
    <AppointmentForm v-if="showForm" :initial="editing || null" @close="showForm=false; reload()" />
    <BlockHoursModal v-if="showBlock" @close="showBlock=false; reload()" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { startOfWeek, formatISO } from 'date-fns'
import CalendarGrid from '@/components/calendar/CalendarGrid.vue'
import AppointmentForm from '@/components/calendar/AppointmentForm.vue'
import BlockHoursModal from '@/components/calendar/BlockHoursModal.vue'
import http from '@/api/http'

// Estado UI
const viewMode = ref('week')
const uiDate = ref(formatISO(new Date(), { representation: 'date' }))
const currentDate = computed(() => new Date(uiDate.value + 'T00:00:00'))
const startHour = ref(7)  // 7am
const endHour   = ref(21) // 9pm
const q = ref('')
const onlyDomicile = ref(false)

// Datos
const events = ref([])   // citas
const blocks = ref([])   // bloqueos
const showForm = ref(false)
const showBlock = ref(false)
const editing = ref(null)

function rangeISO() {
  const base = currentDate.value
  if (viewMode.value === 'day') {
    const from = new Date(base); from.setHours(0,0,0,0)
    const to   = new Date(base); to.setHours(23,59,59,999)
    return { from: from.toISOString(), to: to.toISOString() }
  }
  // semana: lunes a domingo
  const start = startOfWeek(base, { weekStartsOn: 1 })
  const end   = new Date(start); end.setDate(end.getDate() + 7); end.setMilliseconds(end.getMilliseconds() - 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

async function reload() {
  try {
    const { from, to } = rangeISO()
    const params = { from, to, q: q.value || undefined, is_domicile: onlyDomicile.value ? 1 : undefined }
    const [a, b] = await Promise.all([
      http.get('/business/appointments', { params }),
      http.get('/business/appointment-blocks', { params: { from, to } })
    ])
    events.value = a.data.items || []
    blocks.value = b.data.items || []
  } catch (err) {
    console.error('[Agenda] reload error:', err)
  }
}

function openNew(){ editing.value = null; showForm.value = true }
function onEdit(item){ editing.value = item; showForm.value = true }
async function onDelete(item){
  if (!confirm('¿Eliminar esta cita?')) return
  await http.delete(`/business/appointments/${item.id}`)
  reload()
}
function openBlock(){ showBlock.value = true }

const displayEvents = computed(() => {
  const qv = (q.value || '').toLowerCase()
  return (events.value || []).filter(e =>
    !qv || `${e.title} ${e.client_name} ${e.client_phone}`.toLowerCase().includes(qv)
  )
})

onMounted(reload)
watch([uiDate, viewMode, onlyDomicile], reload)
</script>
