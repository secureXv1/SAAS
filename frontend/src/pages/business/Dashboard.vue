<template>
  <div class="grid gap-4 md:grid-cols-3">
    <div class="card md:col-span-2">
      <h2 class="font-semibold mb-3">Resumen</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Citas hoy" :value="0"/>
        <Kpi label="Ventas" :value="'$0'"/>
        <Kpi label="Gastos" :value="'$0'"/>
        <Kpi label="Pedidos" :value="0"/>
      </div>
    </div>
    <div class="card">
      <h2 class="font-semibold mb-2">Notificaciones</h2>
      <p class="text-sm text-slate-500">Aparecerán aquí nuevas citas y pedidos.</p>
    </div>
  </div>
</template>

<script setup>
const Kpi = (props) => null
</script>

<script>
export default {
  components: {
    Kpi: {
      props: ['label','value'],
      template: `
        <div class="p-3 rounded-xl bg-slate-100">
          <div class="text-xs text-slate-500">{{ label }}</div>
          <div class="text-xl font-bold">{{ value }}</div>
        </div>`
    }
  }
}
</script>
