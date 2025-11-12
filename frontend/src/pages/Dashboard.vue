<template>
  <div class="grid gap-4 md:grid-cols-3">
    <div class="card md:col-span-2">
      <h2 class="font-semibold mb-2">Resumen</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3 rounded-xl bg-slate-100">
          <div class="text-xs text-slate-500">Citas hoy</div>
          <div class="text-xl font-bold">0</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-100">
          <div class="text-xs text-slate-500">Ventas</div>
          <div class="text-xl font-bold">$0</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-100">
          <div class="text-xs text-slate-500">Gastos</div>
          <div class="text-xl font-bold">$0</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-100">
          <div class="text-xs text-slate-500">Pedidos</div>
          <div class="text-xl font-bold">0</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="font-semibold mb-2">Notificaciones</h2>
      <p class="text-sm text-slate-500">Aquí aparecerán alertas de nuevas citas y pedidos.</p>
    </div>

    <div class="card md:col-span-3">
      <h2 class="font-semibold mb-2">Próximamente</h2>
      <ul class="list-disc pl-5 text-sm text-slate-600 space-y-1">
        <li>Calendario de citas (día/semana)</li>
        <li>Clientes, Items, Ventas con abonos</li>
        <li>Gastos y Reportes</li>
        <li>Pedidos/Domicilios</li>
      </ul>
    </div>
  </div>
</template>
