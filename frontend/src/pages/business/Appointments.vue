<template>
  <div class="min-h-screen bg-slate-50">
    <!-- HERO / Filtros -->
    <div class="bg-gradient-to-r from-slate-800 to-slate-700">
      <div
        class="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 class="text-white text-2xl font-semibold">Agenda</h1>
          <p class="text-slate-300 text-sm">Gestiona tus citas y bloqueos</p>
          <p class="text-slate-400 text-xs mt-1">
            Intervalo: {{ slotMinutes }} min — de {{ pad(startHour) }}:00 a {{ pad(endHour) }}:00
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input
            type="date"
            v-model="uiDate"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
          />

          <input
            v-model.trim="q"
            placeholder="Buscar (cliente/título/teléfono)"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white w-64"
          />

          <label class="flex items-center gap-2 text-slate-200 text-sm">
            <input type="checkbox" v-model="onlyDomicile" class="accent-sky-400" />
            Domicilio
          </label>

          <button
            @click="openNew"
            class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm"
          >
            Nueva cita
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-xl mx-auto px-4 -mt-6 pb-10">
      <!-- Tira de días -->
      <div class="bg-white rounded-2xl shadow p-3 mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs uppercase tracking-wide text-slate-500">Fecha</span>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="d in days"
            :key="d.key"
            @click="selectDate(d.date)"
            class="flex flex-col items-center min-w-[58px] px-2 py-2 rounded-xl text-xs font-medium transition"
            :class="d.isSelected
              ? 'bg-violet-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          >
            <span class="uppercase">{{ d.weekday }}</span>
            <span class="text-lg leading-tight">{{ d.day }}</span>
          </button>
        </div>
      </div>

      <!-- Horas -->
      <div class="bg-white rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs uppercase tracking-wide text-slate-500">Horario</span>
          <button
            class="text-[11px] text-slate-500 underline"
            @click="reload"
          >
            Actualizar
          </button>
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
          <div
            v-for="slot in slots"
            :key="slot.key"
            class="rounded-xl px-2 py-2 text-sm flex flex-col items-center justify-between shadow-sm border transition"
            :class="[
              slot.hasBlock
                ? 'bg-slate-400 border-slate-500 text-white'
                : slot.hasAppointment
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
            ]"
          >
            <!-- Hora -->
            <div class="font-semibold">{{ slot.label }}</div>

            <!-- Info corta -->
            <div class="text-[11px] text-center leading-tight mt-1" v-if="slot.hasAppointment">
              {{ slot.appointment.title || 'Cita' }}
              <br />
              <span class="opacity-80">
                {{ slot.appointment.client_name || 'Cliente' }}
              </span>
            </div>
            <div class="text-[11px] mt-1" v-else-if="slot.hasBlock">
              Bloqueado
            </div>
            <div class="text-[11px] mt-1 text-slate-500" v-else>
              Libre
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-2 mt-2">
              <!-- Libre: + y bloquear -->
              <button
                v-if="!slot.hasAppointment && !slot.hasBlock"
                class="rounded-full w-7 h-7 grid place-items-center text-xs font-bold bg-white/90 text-emerald-600 border border-emerald-500 hover:bg-emerald-50"
                title="Nueva cita en esta hora"
                @click.stop="createAppointmentFromSlot(slot)"
              >
                +
              </button>
              <button
                v-if="!slot.hasBlock"
                class="rounded-full w-7 h-7 grid place-items-center text-xs bg-white/90 text-slate-700 border border-slate-400 hover:bg-slate-50"
                :title="slot.hasAppointment ? 'Bloquear este horario (además de la cita)' : 'Bloquear este horario'"
                @click.stop="blockSlot(slot)"
              >
                🔒
              </button>

              <!-- Con cita: lápiz -->
              <button
                v-if="slot.hasAppointment"
                class="rounded-full w-7 h-7 grid place-items-center text-xs bg-white/90 text-slate-800 border border-slate-500 hover:bg-slate-100"
                title="Ver / editar cita"
                @click.stop="editAppointmentFromSlot(slot)"
              >
                ✏️
              </button>

              <!-- Con bloqueo: quitar/editar bloqueo -->
              <button
                v-if="slot.hasBlock"
                class="rounded-full w-7 h-7 grid place-items-center text-xs bg-white/90 text-red-700 border border-red-500 hover:bg-red-50"
                title="Editar / eliminar bloqueo"
                @click.stop="editBlockFromSlot(slot)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-slate-400 mt-3">
          Toque una hora libre para crear cita (+) o bloquear (🔒). Horas en verde tienen cita (✏️ para
          editar/cancelar). Horas en gris están bloqueadas (✕ para quitar o ajustar).
        </p>
      </div>
    </div>

    <!-- Modales -->
    <AppointmentForm
      v-if="showForm"
      :initial="editing || null"
      @close="handleFormClosed"
    />
    <BlockHoursModal
      v-if="showBlock"
      :initial="blockInitial"
      @close="handleBlockClosed"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { startOfWeek, addDays, formatISO } from 'date-fns'
import AppointmentForm from '@/components/calendar/AppointmentForm.vue'
import BlockHoursModal from '@/components/calendar/BlockHoursModal.vue'
import http from '@/api/http'

// Config básica (más adelante las puedes sobreescribir con la config de negocio)
const startHour = ref(7)   // 7:00
const endHour   = ref(21)  // 21:00
const slotMinutes = ref(30)

// Filtros
const uiDate = ref(formatISO(new Date(), { representation: 'date' }))
const selectedDate = computed(() => new Date(uiDate.value + 'T00:00:00'))
const q = ref('')
const onlyDomicile = ref(false)

// Datos
const events = ref([])   // citas
const blocks = ref([])   // bloqueos

// Modales
const showForm = ref(false)
const showBlock = ref(false)
const editing = ref(null)
const blockInitial = ref(null)

// --------- Helpers de tiempo ----------

function pad(n) {
  return String(n).padStart(2, '0')
}

function rangeForSelectedDate() {
  const base = selectedDate.value
  const from = new Date(base); from.setHours(0, 0, 0, 0)
  const to   = new Date(base); to.setHours(23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

// --------- UI: tira de días ----------

const days = computed(() => {
  const base = selectedDate.value
  const start = startOfWeek(base, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i)
    const iso = d.toISOString().slice(0, 10)
    return {
      key: iso,
      date: d,
      weekday: d.toLocaleDateString('es-CO', { weekday: 'short' }).toUpperCase(),
      day: String(d.getDate()).padStart(2, '0'),
      isSelected: iso === uiDate.value
    }
  })
})

function selectDate(date) {
  uiDate.value = date.toISOString().slice(0, 10)
}

// --------- Cargar configuración negocio (opcional) ----------
// Si todavía no tienes este endpoint, puedes comentar toda la función y su llamada.
async function loadConfig() {
  try {
    const { data } = await http.get('/business/config')
    if (data?.slot_minutes) {
      slotMinutes.value = Number(data.slot_minutes) || 30
    }
    if (data?.start_hour) startHour.value = Number(data.start_hour)
    if (data?.end_hour)   endHour.value   = Number(data.end_hour)
  } catch (err) {
    // Silencioso: si no existe el endpoint o devuelve 401/404, nos quedamos con los defaults
    // console.debug('[Agenda] No se pudo cargar config negocio', err)
  }
}

// --------- Cargar citas / bloqueos ----------

async function reload() {
  try {
    const { from, to } = rangeForSelectedDate()
    const params = {
      from,
      to,
      q: q.value || undefined,
      is_domicile: onlyDomicile.value ? 1 : undefined
    }
    const [a, b] = await Promise.all([
      http.get('/business/appointments', { params }),
      http.get('/business/appointment-blocks', { params: { from, to } })
    ])
    events.value = a.data.items || []
    blocks.value = b.data.items || []
  } catch (err) {
    // Evitamos llenar la consola: normalmente serán 401 si no hay token o rol business
    console.error('[Agenda] reload error:', err?.response?.status, err?.message)
  }
}

// --------- Filtrar día ----------

const dayEvents = computed(() => {
  const { from, to } = rangeForSelectedDate()
  const fromD = new Date(from)
  const toD   = new Date(to)
  const qv = (q.value || '').toLowerCase()
  return (events.value || []).filter(e => {
    const s = new Date(e.start_at)
    const en = new Date(e.end_at)
    const inRange = s <= toD && en >= fromD
    const text = `${e.title} ${e.client_name} ${e.client_phone}`.toLowerCase()
    const matchesQ = !qv || text.includes(qv)
    const matchesDom = !onlyDomicile.value || e.is_domicile
    return inRange && matchesQ && matchesDom
  })
})

const dayBlocks = computed(() => {
  const { from, to } = rangeForSelectedDate()
  const fromD = new Date(from)
  const toD   = new Date(to)
  return (blocks.value || []).filter(b => {
    const s = new Date(b.start_at)
    const en = new Date(b.end_at)
    return s <= toD && en >= fromD
  })
})

// --------- Generar slots de horas ----------

const slots = computed(() => {
  const result = []
  const base = selectedDate.value
  for (let h = startHour.value; h < endHour.value; h++) {
    for (let m = 0; m < 60; m += slotMinutes.value) {
      const dStart = new Date(base)
      dStart.setHours(h, m, 0, 0)
      const dEnd = new Date(dStart.getTime() + slotMinutes.value * 60000)

      const label = dStart.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      })

      const appt = dayEvents.value.find(e => {
        const s = new Date(e.start_at)
        const en = new Date(e.end_at)
        return s < dEnd && en > dStart
      }) || null

      const block = dayBlocks.value.find(b => {
        const s = new Date(b.start_at)
        const en = new Date(b.end_at)
        return s < dEnd && en > dStart
      }) || null

      result.push({
        key: dStart.toISOString(),
        label,
        startIso: dStart.toISOString(),
        endIso: dEnd.toISOString(),
        hasAppointment: !!appt,
        hasBlock: !!block,
        appointment: appt,
        block
      })
    }
  }
  return result
})

// --------- Acciones sobre slots ----------

function openNew() {
  editing.value = null
  showForm.value = true
}

function createAppointmentFromSlot(slot) {
  editing.value = {
    id: null,
    client_id: null,
    title: '',
    notes: '',
    is_domicile: 0,
    domicile_addr: '',
    domicile_phone: '',
    start_at: slot.startIso.slice(0, 16),
    end_at:   slot.endIso.slice(0, 16)
  }
  showForm.value = true
}

function editAppointmentFromSlot(slot) {
  const appt = slot.appointment
  if (!appt) return
  editing.value = {
    ...appt,
    start_at: appt.start_at.slice(0, 16),
    end_at:   appt.end_at.slice(0, 16)
  }
  showForm.value = true
}

function blockSlot(slot) {
  blockInitial.value = {
    id: slot.block?.id ?? null,
    reason: slot.block?.reason || '',
    start_at: slot.startIso.slice(0, 16),
    end_at:   slot.endIso.slice(0, 16)
  }
  showBlock.value = true
}

function editBlockFromSlot(slot) {
  const bl = slot.block
  if (!bl) return
  blockInitial.value = {
    ...bl,
    start_at: bl.start_at.slice(0, 16),
    end_at:   bl.end_at.slice(0, 16)
  }
  showBlock.value = true
}

// --------- Cierre de modales ----------

function handleFormClosed() {
  showForm.value = false
  editing.value = null
  reload()
}

function handleBlockClosed() {
  showBlock.value = false
  blockInitial.value = null
  reload()
}

// --------- Ciclo de vida ----------

onMounted(async () => {
  await loadConfig()   // si no existe /business/config, esta función simplemente no cambia nada
  await reload()
})

watch([uiDate, onlyDomicile, q], reload)
</script>
