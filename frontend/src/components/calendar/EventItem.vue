<template>
  <div
    class="absolute left-1 right-1 rounded-lg shadow p-2 cursor-pointer border"
    :class="ev.is_domicile ? 'bg-sky-100 border-sky-300' : 'bg-emerald-100 border-emerald-300'"
    :style="{ top: ev._top + 'px', height: ev._height + 'px' }"
    @click="$emit('edit', ev)"
  >
    <div class="text-xs font-semibold truncate">{{ ev.title }}</div>
    <div class="text-[11px] text-slate-600 truncate">
      {{ ev.client_name }} — {{ ev.is_domicile ? 'Domicilio' : 'En sede' }}
    </div>
    <div class="text-[11px] text-slate-500 truncate" v-if="ev.is_domicile">
      {{ ev.domicile_addr }} · {{ ev.domicile_phone }}
    </div>
    <button
      class="absolute bottom-1 right-1 text-[11px] text-red-600"
      @click.stop="$emit('delete', ev)"
    >
      Eliminar
    </button>
  </div>
</template>

<script setup>
defineProps({
  ev: { type: Object, required: true }
})
</script>
