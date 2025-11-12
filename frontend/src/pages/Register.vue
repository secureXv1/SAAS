<template>
  <div class="max-w-md mx-auto py-10 px-4">
    <div class="card space-y-6">
      <div>
        <h1 class="text-xl font-semibold">Crear cuenta</h1>
        <p class="text-slate-500 text-sm">Regístrate como Negocio o Cliente.</p>
      </div>

      <form @submit.prevent="onRegister" class="space-y-3">
        <select v-model="role" class="input">
          <option value="business">Negocio</option>
          <option value="client">Cliente</option>
        </select>
        <input v-model="email" type="email" placeholder="Correo" class="input" />
        <input v-model="password" type="password" placeholder="Contraseña (mín. 6)" class="input" />
        <button class="btn btn-primary w-full">Registrarme</button>
      </form>

      <p v-if="msg" class="text-green-600 text-sm">{{ msg }}</p>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

      <div v-if="showVerify" class="pt-2 border-t">
        <h2 class="font-semibold">Verificar correo</h2>
        <form @submit.prevent="onVerify" class="space-y-3 mt-2">
          <input v-model="code" placeholder="Código (6 dígitos)" class="input" />
          <button class="btn btn-secondary w-full">Verificar</button>
        </form>
        <p v-if="vmsg" class="text-green-600 text-sm">{{ vmsg }}</p>
        <p v-if="verror" class="text-red-600 text-sm">{{ verror }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '@/stores/auth'

const email = ref(''); const password = ref('')
const role = ref('business')
const msg = ref(''); const error = ref('')
const showVerify = ref(false)
const code = ref(''); const vmsg = ref(''); const verror = ref('')
const auth = useAuth()

async function onRegister(){
  msg.value=''; error.value=''
  try{
    await auth.register({ email: email.value, password: password.value, role: role.value })
    msg.value = 'Cuenta creada. Revisa tu correo para el código (o consola del backend).'
    showVerify.value = true
  }catch(e){ error.value = e.response?.data?.error || e.message }
}

async function onVerify(){
  vmsg.value=''; verror.value=''
  try{
    await auth.verify({ email: email.value, code: code.value })
    vmsg.value = 'Correo verificado. Ya puedes iniciar sesión.'
  }catch(e){ verror.value = e.response?.data?.error || e.message }
}
</script>
