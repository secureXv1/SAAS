<!-- src/pages/business/Setup.vue -->
<template>
  <div class="grid gap-6">
    <!-- 1) Plan (separado del guardado de datos) -->
    <div class="card grid gap-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Plan</h2>
        <div v-if="subscription" class="text-xs text-slate-500">
          Vigente: <strong>{{ formatDate(subscription.started_at) }}</strong> → <strong>{{ formatDate(subscription.ends_at) }}</strong>
        </div>
      </div>

      <!-- catálogo de planes -->
      <div class="grid sm:grid-cols-3 gap-3">
        <label
          v-for="p in plans"
          :key="p.code"
          class="border rounded-xl p-3 hover:shadow cursor-pointer flex flex-col justify-between"
          :class="selectedPlan === p.code ? 'ring-2 ring-sky-500' : ''"
        >
          <div>
            <input
              class="mr-2"
              type="radio"
              :value="p.code"
              v-model="selectedPlan"
            />
            <span class="font-medium">{{ p.name }}</span>
            <div class="text-xs text-slate-500">Anual: {{ formatPrice(p.price_yr) }}</div>

            <div class="mt-1 text-[11px]">
              <span
                v-if="p.code === currentPlanCode"
                class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
              >
                Actual
              </span>
            </div>

            <div v-if="Array.isArray(p.features)" class="mt-3 space-y-1">
              <div
                v-for="f in p.features"
                :key="f"
                class="flex items-start gap-2 text-sm text-slate-700"
              >
                <span class="mt-0.5 inline-block w-2 h-2 rounded-full bg-sky-500"></span>
                <span>{{ f }}</span>
              </div>
            </div>
          </div>

          <!-- Botón SOLO si esta card está seleccionada y NO es el plan actual -->
          <div class="mt-4">
            <button
              v-if="selectedPlan === p.code && p.code !== currentPlanCode"
              class="btn btn-primary w-full text-sm"
              @click.stop="openCheckoutFor(p.code)"
            >
              Cambiar a este plan
            </button>

            <!-- Si está seleccionada y es el plan actual, muestra texto -->
            <div
              v-else-if="selectedPlan === p.code && p.code === currentPlanCode"
              class="text-center text-slate-500 text-sm"
            >
              Plan actual
            </div>
            <!-- Si NO está seleccionada: no mostrar nada -->
          </div>
        </label>
      </div>
    </div>

    <!-- 👆 CIERRE de la tarjeta de Plan -->

    <!-- 2) Datos del negocio -->
    <div class="card grid gap-3">
      <h2 class="font-semibold">Datos del negocio</h2>
      <div class="grid sm:grid-cols-2 gap-3">
        <input v-model="form.name" class="input" placeholder="Nombre del negocio" />
        <input v-model="form.nit" class="input" placeholder="NIT (opcional)" />
        <input v-model="form.phone" class="input" placeholder="Teléfono" />
        <input v-model="form.email" class="input" placeholder="Correo" />
        <input v-model="form.website" class="input sm:col-span-2" placeholder="Sitio web (opcional)" />
        <div class="sm:col-span-2">
          <label class="text-sm text-slate-600">Logo (URL por ahora)</label>
          <input v-model="form.logo_url" class="input" placeholder="https://..." />
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
            <InfoTip text="Se usa para generar los espacios (slots) de la Gestión de Citas. Puedes sobreescribirlo por día en la tabla de abajo." />
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
            <InfoTip text="Actívalo para ofrecer productos y servicios a domicilio. Tus clientes podrán separar citas para atención en casa y también podrás agendar entregas de productos." />
          </label>
          <div class="mt-2">
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" v-model="prefs.delivery" />
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
                <input
                  class="input w-28"
                  type="number"
                  min="5"
                  max="240"
                  step="5"
                  v-model.number="row.slot_min"
                  :disabled="!row.is_open"
                  :placeholder="prefs.slotMin ? '('+prefs.slotMin+' por defecto)' : '(por defecto)'"
                />
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

      <!-- === MODAL: Checkout plan === -->
            <div v-if="showCheckout" class="fixed inset-0 z-50">
            <!-- backdrop -->
            <div class="absolute inset-0 bg-slate-900/60" @click="closeCheckout"></div>

            <!-- modal -->
            <div class="absolute inset-0 grid place-items-center p-4">
                <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                <!-- header -->
                <div class="px-6 py-5 border-b flex items-center justify-between">
                    <div>
                    <div class="text-xs uppercase tracking-wide text-slate-400">Confirmar cambio de plan</div>
                    <h3 class="text-xl font-semibold text-slate-800 mt-0.5">
                        {{ modalPlan?.name }}
                    </h3>
                    </div>
                    <div class="text-right">
                    <div class="text-2xl font-bold text-slate-800">{{ formatPrice(modalPlan?.price_yr) }}</div>
                    <div class="text-[11px] text-slate-500">Precio anual</div>
                    </div>
                </div>

                <!-- body -->
                <div class="px-6 py-6 grid lg:grid-cols-[1.2fr,1fr] gap-8">
                    <!-- ventajas -->
                    <div>
                    <div class="mb-3">
                        <span class="inline-block text-[11px] uppercase tracking-wide px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        Beneficios clave
                        </span>
                    </div>

                    <div class="grid sm:grid-cols-2 gap-3">
                        <div
                        v-for="f in (modalPlan?.features || [])"
                        :key="f"
                        class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-sm text-slate-700">{{ f }}</span>
                        </div>
                    </div>

                    <div class="mt-5 flex flex-wrap gap-2">
                        <span class="px-2 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">Soporte prioritario</span>
                        <span class="px-2 py-1 rounded-full text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">Panel administrativo</span>
                        <span class="px-2 py-1 rounded-full text-[11px] bg-amber-50 text-amber-700 border border-amber-200">Reportes ejecutivos</span>
                    </div>
                    </div>

                    <!-- checkout -->
                    <div class="rounded-xl border border-slate-200 p-4">
                    <div class="text-sm text-slate-600">
                        Puedes proceder al pago ahora o, temporalmente, activar con un <strong>código de pago</strong>.
                    </div>

                    <div class="mt-4 space-y-3">
                        <button
                        class="btn btn-primary w-full"
                        :disabled="modalLoading"
                        @click="goToPayment"
                        >
                        {{ modalLoading && !modalDraftId ? 'Preparando pago…' : 'Ir a pagar' }}
                        </button>

                        <div class="relative my-2 text-center">
                        <span class="bg-white px-3 text-xs text-slate-400 relative z-10">o</span>
                        <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-slate-200"></div>
                        </div>

                        <div>
                        <label class="text-xs text-slate-600">Código de pago</label>
                        <input v-model="modalPaymentRef" class="input w-full" placeholder="p.ej. MP-123456 / PI_abc..." />
                        </div>
                        <button
                        class="btn w-full"
                        :disabled="modalLoading || !modalPaymentRef"
                        @click="activateWithCode"
                        >
                        {{ modalLoading ? 'Activando…' : 'Activar con código' }}
                        </button>

                        <div class="text-xs mt-2">
                        <span v-if="modalOk" class="text-emerald-600">{{ modalOk }}</span>
                        <span v-if="modalErr" class="text-red-600">{{ modalErr }}</span>
                        </div>
                    </div>

                    <div class="mt-4 text-[11px] text-slate-400">
                        Al activar, tu suscripción actual se marcará como <em>cancelada</em> y se iniciará el nuevo plan por 12 meses.
                    </div>
                    </div>
                </div>

                <!-- footer -->
                <div class="px-6 py-4 border-t flex items-center justify-end gap-2">
                    <button class="btn" @click="closeCheckout">Cerrar</button>
                </div>
                </div>
            </div>
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

    /* === Estado de Plan (separado) === */
    const selectedPlan = ref(null)      // plan elegido en la UI (code)
    const currentPlanCode = ref(null)   // plan vigente (plan_code)
    const draftId = ref(null)           // id del borrador 'pending_payment'
    const paymentRef = ref('')          // referencia del pago (externa)
    const changingPlan = ref(false)
    const confirmingPlan = ref(false)
    const okPlan = ref(''); const errPlan = ref('')

    const canChangePlan = computed(() =>
    !!selectedPlan.value && !!currentPlanCode.value && selectedPlan.value !== currentPlanCode.value
    )
    const canChooseFirstPlan = computed(() =>
    !currentPlanCode.value && !!selectedPlan.value
    )

    const subscription = ref(null) // <-- guarda sub para mostrar fechas

    // Mostrar prefs de citas si el plan seleccionado o vigente las soporta
    const isAppointmentPlan = computed(() =>
    ['citas','mixto'].includes(selectedPlan.value || currentPlanCode.value || '')
    )


    function formatPrice(v){
    if (v == null) return ''
    try {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
    } catch {
        return `$${v}`
    }
    }

    function safeParseFeatures(raw){
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string'){
        // intenta JSON
        try {
        const j = JSON.parse(raw)
        if (Array.isArray(j)) return j
        } catch {}
        // intenta separar por saltos/comas
        const parts = raw.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)
        return parts
    }
    return []
    }

    function formatDate(iso){
    if (!iso) return ''
    try {
        const d = new Date(iso)
        return d.toLocaleDateString('es-CO', { year:'numeric', month:'2-digit', day:'2-digit' })
    } catch { return iso }
    }



onMounted(load)

async function load(){
  try{
    const { data: plansData } = await http.get('/business/plans')
    plans.value = (Array.isArray(plansData) ? plansData : []).map(p => ({
    ...p,
    features: safeParseFeatures(p.features)
    }))


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

  // === Modal de checkout ===
const showCheckout = ref(false)
const modalPlan = ref(null)        // objeto plan seleccionado
const modalDraftId = ref(null)     // draft interno (oculto a la UI)
const modalPaymentRef = ref('')
const modalLoading = ref(false)
const modalOk = ref(''); const modalErr = ref('')

// Abre modal para un plan específico (desde botón de la card)
function openCheckoutFor(planCode){
  selectedPlan.value = planCode
  openCheckout()
}

function openCheckout(){
  modalOk.value = ''; modalErr.value = ''
  modalDraftId.value = null
  modalPaymentRef.value = ''
  modalPlan.value = (plans.value || []).find(x => x.code === selectedPlan.value) || null
  showCheckout.value = true
}

function closeCheckout(){
  showCheckout.value = false
}

// Asegura borrador pendiente de pago (sin mostrar en UI)
async function ensureDraft(){
  if (modalDraftId.value) return modalDraftId.value
  if (!modalPlan.value) throw new Error('No hay plan seleccionado.')
  const { data } = await http.post('/business/me/change-plan/init', { plan: modalPlan.value.code })
  modalDraftId.value = data?.draftSubscriptionId || null
  return modalDraftId.value
}

// CTA principal: Ir a pagar (prepara draft y redirige — luego integrarás checkout real)
async function goToPayment(){
  modalOk.value=''; modalErr.value=''; modalLoading.value=true
  try{
    const draftId = await ensureDraft()
    if (!draftId) throw new Error('No fue posible preparar el pago.')
    // TODO: integrar pasarela. Por ahora, mostramos aviso.
    modalOk.value = 'Borrador preparado. Redirige a tu pasarela aquí.'
    // window.location.href = `/checkout?draft=${draftId}` // ejemplo
  }catch(e){
    modalErr.value = e.response?.data?.error || e.message
  }finally{
    modalLoading.value=false
  }
}

// Activar con código (sin mostrar creación de borrador)
async function activateWithCode(){
  modalOk.value=''; modalErr.value=''; modalLoading.value=true
  try{
    const draftId = await ensureDraft()
    if (!draftId) throw new Error('No fue posible preparar la activación.')
    if (!modalPaymentRef.value) throw new Error('Ingresa el código de pago.')
    await http.post('/business/me/change-plan/confirm', {
      draftId: Number(draftId),
      paymentRef: modalPaymentRef.value
    })
    modalOk.value = 'Plan activado correctamente.'
    await load()
    showCheckout.value = false
  }catch(e){
    modalErr.value = e.response?.data?.error || e.message
  }finally{
    modalLoading.value=false
  }
}




</script>
