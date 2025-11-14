<template>
  <div
    class="absolute left-1 right-1 rounded-lg shadow p-2 bg-slate-200 border border-slate-300 opacity-80"
    :style="{ top: bl._top + 'px', height: bl._height + 'px' }"
  >
    <div class="text-xs font-semibold truncate">Bloqueado · {{ bl.reason }}</div>
  </div>
</template>

<script setup>
defineProps({
  bl: { type: Object, required: true }
})
</script>
