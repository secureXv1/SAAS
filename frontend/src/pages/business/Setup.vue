<!-- src/pages/business/Setup.vue -->
<template>
  <div class="grid gap-6">
<!-- 1) Plan (separado del guardado de datos) -->
<div class="card grid gap-3">
  <div class="flex items-center justify-between">
    <h2 class="font-semibold">Plan</h2>
    <div v-if="subscription" class="text-xs text-slate-500">
      Vigente: <strong>{{ subscription.started_at }}</strong> → <strong>{{ subscription.ends_at }}</strong>
    </div>
  </div>

  <!-- catálogo de planes -->
    <div class="grid sm:grid-cols-3 gap-3">
        <label
        v-for="p in plans"
        :key="p.code"
        class="border rounded-xl p-3 hover:shadow cursor-pointer"
        :class="selectedPlan === p.code ? 'ring-2 ring-sky-500' : ''"
        >
        <input class="mr-2" type="radio" :value="p.code" v-model="selectedPlan">
        {{ p.name }}
        <div class="text-xs text-slate-500">Anual: {{ formatPrice(p.price_yr) }}</div>
        <div v-if="Array.isArray(p.features)" class="mt-2">
            <ul class="text-xs list-disc pl-4 text-slate-500">
            <li v-for="f in p.features" :key="f">{{ f }}</li>
            </ul>
        </div>
        </label>
    </div>

    <div class="flex flex-wrap items-center gap-2">
        <button class="btn" :disabled="changingPlan || !selectedPlan || selectedPlan===currentPlanCode"
                @click="initPlanChange">
        {{ changingPlan ? 'Creando borrador…' : (currentPlanCode ? 'Cambiar de plan' : 'Elegir plan') }}
        </button>

        <!-- visible solo si ya hay un borrador pendiente -->
        <template v-if="draftId">
        <input v-model="paymentRef" class="input w-64" placeholder="Referencia de pago (paymentRef)" />
        <button class="btn btn-primary" :disabled="confirmingPlan || !paymentRef" @click="confirmPlanChange">
            {{ confirmingPlan ? 'Confirmando…' : 'Confirmar cambio' }}
        </button>
        </template>

        <span class="text-green-600 text-sm" v-if="okPlan">{{ okPlan }}</span>
        <span class="text-red-600 text-sm" v-if="errPlan">{{ errPlan }}</span>
    </div>
    </div>


    <!-- 2) Datos del negocio -->
    <div class="card grid gap-3">
      <h2 class="font-semibold">Datos del negocio</h2>
      <div class="grid sm:grid-cols-2 gap-3">
        <input v-model="form.name" class="input" placeholder="Nombre del negocio">
        <input v-model="form.nit" class="input" placeholder="NIT (opcional)">
        <input v-model="form.phone" class="input" placeholder="Teléfono">
        <input v-model="form.email" class="input" placeholder="Correo">
        <input v-model="form.website" class="input sm:col-span-2" placeholder="Sitio web (opcional)">
        <div class="sm:col-span-2">
          <label class="text-sm text-slate-600">Logo (URL por ahora)</label>
          <input v-model="form.logo_url" class="input" placeholder="https://...">
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" @click="save">Guardar</button>
        <span class="text-green-600 text-sm" v-if="ok">{{ ok }}</span>
        <span class="text-red-600 text-sm" v-if="err">{{ err }}</span>
      </div>
    </div>

    <!-- 3) Preferencias de citas (solo si el plan permite citas) -->
    <div class="card grid gap-3" v-if="isAppointmentPlan">
    <div class="flex items-center justify-between">
        <h2 class="font-semibold">Preferencias de citas</h2>
    </div>

    <div class="grid sm:grid-cols-2 gap-3">
        <!-- Intervalo -->
        <div>
        <label class="text-sm text-slate-700 flex items-center gap-2">
            Intervalo por defecto (min)
            <InfoTip text="Se usa para generar los espacios (slots) de la Gestión de Citas. Puedes sobreescribirlo por día en la tabla de abajo."/>
        </label>
        <select v-model.number="prefs.slotMin" class="input mt-1 w-full sm:w-56">
            <option :value="15">15</option>
            <option :value="20">20</option>
            <option :value="30">30</option>
            <option :value="45">45</option>
            <option :value="60">60</option>
        </select>
        </div>

        <!-- Servicio a domicilio -->
        <div>
        <label class="text-sm text-slate-700 flex items-center gap-2">
            Servicio a domicilio
            <InfoTip text="Actívalo para ofrecer productos y servicios a domicilio. Tus clientes podrán separar citas para atención en casa y también podrás agendar entregas de productos."/>
        </label>
        <div class="mt-2">
            <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="prefs.delivery">
            <span class="text-sm">Ofrezco servicio a domicilio</span>
            </label>
        </div>
        </div>
    </div>

    <div>
        <button class="btn btn-secondary w-full sm:w-auto" @click="savePrefs">Guardar preferencias</button>
        <span class="text-green-600 text-sm ml-3" v-if="okPrefs">{{ okPrefs }}</span>
        <span class="text-red-600 text-sm ml-3" v-if="errPrefs">{{ errPrefs }}</span>
    </div>
    </div>



    <!-- 4) Horario por día (ÚNICA sección de horarios) -->
    <div class="card grid gap-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Horario por día</h2>
        <button class="btn btn-secondary text-xs" @click="copyToAll()">Copiar Lunes a todos</button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-slate-500">
              <th class="py-2 pr-3">Día</th>
              <th class="py-2 pr-3">Abierto</th>
              <th class="py-2 pr-3">Inicio</th>
              <th class="py-2 pr-3">Fin</th>
              <th class="py-2 pr-3">Intervalo (min)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in week" :key="row.dow" class="border-t">
              <td class="py-2 pr-3">{{ row.label }}</td>
              <td class="py-2 pr-3">
                <input type="checkbox" v-model="row.is_open" />
              </td>
              <td class="py-2 pr-3">
                <select class="input" v-model="row.start_hhmm" :disabled="!row.is_open">
                  <option v-for="t in timeOptions" :key="'s'+row.dow+t" :value="t">{{ t }}</option>
                </select>
              </td>
              <td class="py-2 pr-3">
                <select class="input" v-model="row.end_hhmm" :disabled="!row.is_open">
                  <option v-for="t in timeOptions" :key="'e'+row.dow+t" :value="t">{{ t }}</option>
                </select>
              </td>
              <td class="py-2 pr-3">
                <input class="input w-28" type="number" min="5" max="240" step="5"
                       v-model.number="row.slot_min" :disabled="!row.is_open"
                       :placeholder="prefs.slotMin ? '('+prefs.slotMin+' por defecto)' : '(por defecto)'" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <button class="btn btn-secondary w-full sm:w-auto" @click="saveWeekly">Guardar horario por día</button>
        <span class="text-green-600 text-sm ml-3" v-if="ok2">{{ ok2 }}</span>
        <span class="text-red-600 text-sm ml-3" v-if="err2">{{ err2 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import http from '@/api/http'
import { ref, onMounted, computed } from 'vue'
import { toMinute, fromMinute, buildTimeOptions } from '@/utils/time'

/* --- InfoTip: icono “i” con tooltip accesible --- */
const InfoTip = {
  props: { text: { type: String, required: true } },
  template: `
  <span class="relative inline-flex items-center group select-none">
    <span class="w-5 h-5 grid place-items-center rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold cursor-help"
          :title="text">i</span>
    <span class="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-900 text-white text-xs rounded-md px-2 py-1 shadow whitespace-normal max-w-xs">
      {{ text }}
    </span>
  </span>`
}

const plans = ref([])
const ok = ref(''); const err = ref('')

const form = ref({
  name: '',
  nit: '',
  phone: '',
  email: '',
  website: '',
  logo_url: ''
})


/* Preferencias (solo intervalo y domicilio) */
const prefs = ref({
  slotMin: 30,
  delivery: false
})
const okPrefs = ref(''); const errPrefs = ref('')

/* Horario semanal */
const ok2 = ref(''); const err2 = ref('')
const timeOptions = buildTimeOptions(15)
const week = ref([
  { dow:1, label:'Lunes',     is_open:false, start_hhmm:'08:00', end_hhmm:'18:00', slot_min:null },
  { dow:2, label:'Martes',    is_open:false, start_hhmm:'08:00', end_hhmm:'18:00', slot_min:null },
  { dow:3, label:'Miércoles', is_open:false, start_hhmm:'08:00', end_hhmm:'18:00', slot_min:null },
  { dow:4, label:'Jueves',    is_open:false, start_hhmm:'08:00', end_hhmm:'18:00', slot_min:null },
  { dow:5, label:'Viernes',   is_open:false, start_hhmm:'08:00', end_hhmm:'18:00', slot_min:null },
  { dow:6, label:'Sábado',    is_open:false, start_hhmm:'08:00', end_hhmm:'14:00', slot_min:null },
  { dow:0, label:'Domingo',   is_open:false, start_hhmm:'08:00', end_hhmm:'12:00', slot_min:null },
])

const subscription = ref(null) // <-- guarda sub para mostrar fechas
const isAppointmentPlan = computed(() => ['citas','mixto'].includes(selectedPlan.value || currentPlanCode.value || ''))


/* === Estado de Plan (separado) === */
const selectedPlan = ref(null)      // plan elegido en la UI (code)
const currentPlanCode = ref(null)   // plan vigente (plan_code)
const draftId = ref(null)           // id del borrador 'pending_payment'
const paymentRef = ref('')          // referencia del pago (externa)
const changingPlan = ref(false)
const confirmingPlan = ref(false)
const okPlan = ref(''); const errPlan = ref('')

function formatPrice(v){
  if (v == null) return ''
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
  } catch {
    return `$${v}`
  }
}


onMounted(load)

async function load(){
  try{
    const { data: plansData } = await http.get('/business/plans')
    plans.value = plansData

    const { data } = await http.get('/business/me')

    // perfil
    if (data?.business){
      form.value.name = data.business.name || ''
      form.value.nit = data.business.nit || ''
      form.value.phone = data.business.phone || ''
      form.value.email = data.business.email || ''
      form.value.website = data.business.website || ''
      form.value.logo_url = data.business.logo_url || ''
    }

    // plan vigente
    if (data?.subscription?.plan_code){
    currentPlanCode.value = data.subscription.plan_code
    selectedPlan.value = data.subscription.plan_code // deja preseleccionado el actual
    subscription.value = {
        started_at: data.subscription.started_at,
        ends_at: data.subscription.ends_at
    }
    } else {
    currentPlanCode.value = null
    // si no hay vigente, deja seleccionado el primero del catálogo cuando cargue
    if (Array.isArray(plans.value) && plans.value.length) {
        selectedPlan.value = plans.value[0].code
    }
    }


    // prefs (slot + delivery)
    if (data?.prefs){
      prefs.value.slotMin = data.prefs.slot_min ?? prefs.value.slotMin
      prefs.value.delivery = !!data.prefs.delivery
    }

    // horario semanal (igual que ya tenías)
    const map = new Map((data.hours || []).map(h => [h.dow, h]))
    week.value = week.value.map(r => {
      const h = map.get(r.dow)
      if (!h) return r
      return {
        ...r,
        is_open: !!h.is_open,
        start_hhmm: h.start_min!=null ? fromMinute(h.start_min) : r.start_hhmm,
        end_hhmm:   h.end_min!=null   ? fromMinute(h.end_min)   : r.end_hhmm,
        slot_min:   h.slot_min ?? null
      }
    })
  }catch(e){
    console.warn(e)
  }
}

async function save(){
  ok.value=''; err.value=''
  try{
    await http.put('/business/me', {
    name: form.value.name,
    nit: form.value.nit || undefined,
    phone: form.value.phone,
    email: form.value.email,
    website: form.value.website || undefined,
    logo_url: form.value.logo_url || undefined
    })

    ok.value = 'Datos del negocio guardados'
  }catch(e){
    err.value = e.response?.data?.error || e.message
  }
}

function copyToAll(){
  const monday = week.value.find(w => w.dow===1)
  if (!monday) return
  week.value = week.value.map(r => r.dow===1 ? r : {
    ...r,
    is_open: monday.is_open,
    start_hhmm: monday.start_hhmm,
    end_hhmm: monday.end_hhmm,
    slot_min: monday.slot_min
  })
}

async function savePrefs(){
  okPrefs.value=''; errPrefs.value=''
  try{
    // Derivamos un start/end por defecto desde el primer día abierto,
    // ya que el endpoint actual requiere startHour/endHour.
    const firstOpen = week.value.find(w => w.is_open)
    const startHour = firstOpen ? Number(firstOpen.start_hhmm.split(':')[0]) : 8
    const endHour   = firstOpen ? Number(firstOpen.end_hhmm.split(':')[0])   : 18

    await http.put('/business/me/schedule', {
      startHour,
      endHour,
      slotMin: Number(prefs.value.slotMin),
      delivery: !!prefs.value.delivery
    })
    okPrefs.value = 'Preferencias guardadas'
  }catch(e){
    errPrefs.value = e.response?.data?.error || e.message
  }
}

async function saveWeekly(){
  ok2.value=''; err2.value=''
  try{
    const payload = {
      hours: week.value.map(r => ({
        dow: r.dow,
        is_open: !!r.is_open,
        start_min: r.is_open ? toMinute(r.start_hhmm) : null,
        end_min:   r.is_open ? toMinute(r.end_hhmm)   : null,
        slot_min:  r.is_open ? (r.slot_min || null)   : null
      }))
    }
    await http.put('/business/me/hours', payload)
    ok2.value = 'Horario semanal guardado'
  }catch(e){
    err2.value = e.response?.data?.error || e.message
  }
}

async function initPlanChange(){
  okPlan.value=''; errPlan.value=''; changingPlan.value = true
  try{
    if (!selectedPlan.value) throw new Error('Selecciona un plan')
    // Evita llamar si no hay cambio
    if (currentPlanCode.value && selectedPlan.value === currentPlanCode.value){
      okPlan.value = 'Ya estás en este plan.'
      return
    }
    const { data } = await http.post('/business/me/change-plan/init', { plan: selectedPlan.value })
    draftId.value = data?.draftSubscriptionId || null
    okPlan.value = 'Borrador creado. Ingresa la referencia de pago y confirma.'
  }catch(e){
    errPlan.value = e.response?.data?.error || e.message
  }finally{
    changingPlan.value = false
  }
}

async function confirmPlanChange(){
  okPlan.value=''; errPlan.value=''; confirmingPlan.value = true
  try{
    if (!draftId.value) throw new Error('No hay un borrador pendiente.')
    if (!paymentRef.value) throw new Error('Falta la referencia de pago.')
    await http.post('/business/me/change-plan/confirm', {
      draftId: Number(draftId.value),
      paymentRef: paymentRef.value
    })
    okPlan.value = 'Plan activado correctamente.'
    // refresca datos para ver vigencia actualizada
    await load()
    // limpia draft y ref
    paymentRef.value = ''
    draftId.value = null
  }catch(e){
    errPlan.value = e.response?.data?.error || e.message
  }finally{
    confirmingPlan.value = false
  }
}



</script>
