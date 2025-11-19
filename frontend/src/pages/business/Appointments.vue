<template>

<!-- HEADER DEL NEGOCIO -->
<header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
  <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

    <!-- Izquierda: logo + nombre -->
    <div class="flex items-center gap-3">
      <div
        v-if="business?.logo_url"
        class="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden"
      >
        <img
          :src="business.logo_url"
          alt="Logo negocio"
          class="w-full h-full object-cover"
        />
      </div>
      <div
        v-else
        class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 grid place-items-center text-white font-bold"
      >
        {{ business?.name?.charAt(0) || 'N' }}
      </div>

      <div>
        <h2 class="font-semibold text-slate-800">{{ business?.name || 'Mi Negocio' }}</h2>
        <p class="text-xs text-slate-400">Agenda de citas</p>
      </div>
    </div>

    <!-- Derecha: Botón cerrar sesión -->
    <button
      @click="logout"
      class="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
    >
      Cerrar sesión
    </button>
  </div>
</header>



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
            Intervalo: {{ heroSlotMinutes }} min — de {{ pad(heroStartHour) }}:00 a {{ pad(heroEndHour) }}:00
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


const business = ref(null)

async function loadBusiness() {
  try {
    const { data } = await http.get('/business/me')
    business.value = data.business
  } catch (err) {
    console.error('Error cargando negocio', err)
  }
}

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

function toLocalInput(d) {
  const pad = n => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

const hoursByDow = ref([])   // horario por día (business_hours)


// Config efectiva para el día seleccionado
const effectiveDayConfig = computed(() => {
  const base = selectedDate.value
  const dowJs = base.getDay() // 0=domingo ... 6=sábado

  // Si en DB dow es 0..6 igual que JS:
  let dowDb = dowJs

  // 👉 Si tu tabla business_hours usa 1..7 (1=lunes,...,7=domingo),
  // comenta la línea anterior y usa esta:
  // const dowDb = ((dowJs + 6) % 7) + 1

  const cfg = (hoursByDow.value || []).find(h => h.dow === dowDb)

  const defaultSlot = slotMinutes.value
  const defaultStartMin = startHour.value * 60
  const defaultEndMin   = endHour.value * 60

  if (!cfg) {
    // No hay config específica para este día: usar defaults
    return {
      isOpen: true,
      slotMin: defaultSlot,
      startMin: defaultStartMin,
      endMin: defaultEndMin
    }
  }

  if (!cfg.is_open) {
    // Día cerrado: puedes decidir devolver isOpen:false y así no generar slots
    return {
      isOpen: false,
      slotMin: cfg.slot_min || defaultSlot,
      startMin: cfg.start_min ?? defaultStartMin,
      endMin: cfg.end_min ?? defaultEndMin
    }
  }

  return {
    isOpen: true,
    slotMin: cfg.slot_min || defaultSlot,
    startMin: cfg.start_min ?? defaultStartMin,
    endMin: cfg.end_min ?? defaultEndMin
  }
})

const heroSlotMinutes = computed(() => effectiveDayConfig.value.slotMin)

const heroStartHour = computed(() => {
  return Math.floor(effectiveDayConfig.value.startMin / 60)
})

const heroEndHour = computed(() => {
  return Math.floor(effectiveDayConfig.value.endMin / 60)
})



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
  uiDate.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// --------- Cargar configuración negocio (opcional) ----------
// Si todavía no tienes este endpoint, puedes comentar toda la función y su llamada.
async function loadConfig() {
  try {
    const { data } = await http.get('/business/config')
    if (data?.slot_min != null) {
      slotMinutes.value = Number(data.slot_min) || 30
    }
    if (data?.start_hour != null) startHour.value = Number(data.start_hour)
    if (data?.end_hour != null)   endHour.value   = Number(data.end_hour)
    if (Array.isArray(data?.hours_by_dow)) {
      hoursByDow.value = data.hours_by_dow
    }
  } catch (err) {
    console.error('[Agenda] loadConfig error:', err?.message)
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
  const cfg = effectiveDayConfig.value

  // Si el día está marcado como cerrado, no generamos slots
  if (!cfg.isOpen) {
    return result
  }

  const slotMin = cfg.slotMin
  const startMin = cfg.startMin
  const endMin   = cfg.endMin

  for (let t = startMin; t < endMin; t += slotMin) {
    const dStart = new Date(base)
    const h = Math.floor(t / 60)
    const m = t % 60
    dStart.setHours(h, m, 0, 0)

    const dEnd = new Date(dStart.getTime() + slotMin * 60000)

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
      startIso: toLocalInput(dStart),   // usamos el helper local que ya tienes
      endIso: toLocalInput(dEnd),
      hasAppointment: !!appt,
      hasBlock: !!block,
      appointment: appt,
      block
    })
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
  await loadBusiness()
  await loadConfig()
  await reload()
})

watch([uiDate, onlyDomicile, q], reload)
</script>
