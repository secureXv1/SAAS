<template>
  <div class="grid gap-6">
    <!-- 1) Plan -->
    <div class="card">
      <h2 class="font-semibold mb-3">Selecciona tu plan</h2>
      <div class="grid sm:grid-cols-3 gap-3">
        <label class="border rounded-xl p-3 hover:shadow cursor-pointer">
          <input class="mr-2" type="radio" value="citas" v-model="form.plan"> Gestión de citas
          <div class="text-xs text-slate-500">Anual: $300.000</div>
        </label>
        <label class="border rounded-xl p-3 hover:shadow cursor-pointer">
          <input class="mr-2" type="radio" value="contable" v-model="form.plan"> Gestión contable
          <div class="text-xs text-slate-500">Anual: $350.000</div>
        </label>
        <label class="border rounded-xl p-3 hover:shadow cursor-pointer">
          <input class="mr-2" type="radio" value="mixto" v-model="form.plan"> Mixto
          <div class="text-xs text-slate-500">Anual: $600.000</div>
        </label>
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

    <!-- 3) Horarios básicos -->
    <div class="card grid gap-3">
      <h2 class="font-semibold">Horarios e intervalos</h2>
      <div class="grid sm:grid-cols-3 gap-3">
        <select v-model.number="form.startHour" class="input">
          <option v-for="h in 24" :key="'s'+h" :value="h-1">{{ (h-1).toString().padStart(2,'0') }}:00</option>
        </select>
        <select v-model.number="form.endHour" class="input">
          <option v-for="h in 24" :key="'e'+h" :value="h-1">{{ (h-1).toString().padStart(2,'0') }}:00</option>
        </select>
        <select v-model.number="form.slotMin" class="input">
          <option :value="15">15 min</option>
          <option :value="20">20 min</option>
          <option :value="30">30 min</option>
          <option :value="45">45 min</option>
          <option :value="60">60 min</option>
        </select>
      </div>
      <div>
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.delivery"> Ofrezco servicio a domicilio
        </label>
      </div>
      <button class="btn btn-secondary w-full sm:w-auto" @click="saveSchedule">Guardar horarios</button>
    </div>
  </div>
</template>

<script setup>
import http from '@/api/http'
import { ref, onMounted } from 'vue'

const form = ref({
  plan: 'mixto',
  name: '',
  nit: '',
  phone: '',
  email: '',
  website: '',
  logo_url: '',
  startHour: 8,
  endHour: 18,
  slotMin: 30,
  delivery: false
})

const ok = ref(''); const err = ref('')

onMounted(load)

async function load(){
  try{
    // cuando tengamos backend: GET /api/business/me
    // const { data } = await http.get('/business/me')
    // Object.assign(form.value, data || {})
  }catch(e){ console.warn(e) }
}

async function save(){
  ok.value=''; err.value=''
  try{
    // cuando tengamos backend:
    // await http.put('/business/me', form.value)
    ok.value = 'Datos del negocio guardados'
  }catch(e){ err.value = e.response?.data?.error || e.message }
}

async function saveSchedule(){
  ok.value=''; err.value=''
  try{
    // cuando tengamos backend:
    // await http.put('/business/me/schedule', { startHour, endHour, slotMin, delivery })
    ok.value = 'Horarios guardados'
  }catch(e){ err.value = e.response?.data?.error || e.message }
}
</script>
