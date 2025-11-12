import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './router'
import './assets/main.css'
import AppShell from './layouts/AppShell.vue'

createApp(AppShell).use(createPinia()).use(router).mount('#app')
