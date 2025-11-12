<template>
  <div class="max-w-md mx-auto py-10 px-4">
    <div class="card space-y-4">
      <h1 class="text-xl font-semibold">Iniciar sesión</h1>

      <form @submit.prevent="onSubmit" class="space-y-3">
        <input v-model="email" type="email" placeholder="Correo" class="input" autocomplete="username" />
        <input v-model="password" type="password" placeholder="Contraseña" class="input" autocomplete="current-password" />
        <button class="btn btn-primary w-full">Entrar</button>
      </form>

      <p class="text-sm">
        ¿No tienes cuenta?
        <RouterLink to="/register" class="text-sky-600">Regístrate</RouterLink>
      </p>

      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const auth = useAuth()
const router = useRouter()

async function onSubmit() {
  error.value = ''
  try {
    await auth.login({ email: email.value, password: password.value })
    router.push('/app/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || e.message
  }
}
</script>
