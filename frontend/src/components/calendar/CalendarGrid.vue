<template>
  <div class="bg-white rounded-2xl shadow p-3 sm:p-4">
    <!-- Cabecera de días (semana) -->
    <div v-if="mode==='week'" class="grid grid-cols-8 text-xs sm:text-sm font-medium text-slate-600 border-b pb-2">
      <div></div>
      <div v-for="(d,i) in days" :key="i" class="text-center">
        {{ d.label }}
      </div>
    </div>

    <!-- Semana -->
    <div v-if="mode==='week'" class="grid grid-cols-8 text-xs">
      <!-- Columna horas -->
      <div class="border-r pr-2 select-none">
        <div
          v-for="h in hours"
          :key="h"
          class="text-right pr-1 text-slate-400"
          :style="{ height: rowHeight * rowsPerHour + 'px' }"
        >
          {{ pad(h) }}:00
        </div>
      </div>

      <!-- Columnas por día -->
      <div
        v-for="(d,dayIndex) in days"
        :key="'c'+dayIndex"
        class="border-l -ml-px relative"
      >
        <!-- rejilla de slots -->
        <div
          v-for="slotIndex in totalSlots"
          :key="slotIndex"
          class="border-b cursor-pointer hover:bg-slate-50"
          :style="{ height: rowHeight + 'px' }"
          @click="handleSlotClick(dayIndex, slotIndex - 1)"
        ></div>

        <!-- eventos -->
        <EventItem
          v-for="ev in eventsByDay(dayIndex)"
          :key="ev.id"
          :ev="ev"
          @edit="$emit('edit', ev)"
          @delete="$emit('delete', ev)"
        />
        <!-- bloqueos -->
        <BlockItem
          v-for="bl in blocksByDay(dayIndex)"
          :key="'b'+bl.id"
          :bl="bl"
        />
      </div>
    </div>

    <!-- Día -->
    <div v-else class="grid grid-cols-[60px_1fr] text-xs">
      <div class="border-r pr-2 select-none">
        <div
          v-for="h in hours"
          :key="h"
          class="text-right pr-1 text-slate-400"
          :style="{ height: rowHeight * rowsPerHour + 'px' }"
        >
          {{ pad(h) }}:00
        </div>
      </div>
      <div class="relative">
        <div
          v-for="slotIndex in totalSlots"
          :key="slotIndex"
          class="border-b cursor-pointer hover:bg-slate-50"
          :style="{ height: rowHeight + 'px' }"
          @click="handleSlotClick(0, slotIndex - 1)"
        ></div>

        <EventItem
          v-for="ev in eventsInDay()"
          :key="ev.id"
          :ev="ev"
          @edit="$emit('edit', ev)"
          @delete="$emit('delete', ev)"
        />
        <BlockItem
          v-for="bl in blocksInDay()"
          :key="'b'+bl.id"
          :bl="bl"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { startOfWeek, addDays, startOfDay, differenceInMinutes } from 'date-fns'
import EventItem from './EventItem.vue'
import BlockItem from './BlockItem.vue'

const emit = defineEmits(['edit','delete','slot-click'])

const props = defineProps({
  date: { type: Date, required: true },
  mode: { type: String, default: 'week' }, // 'week' | 'day'
  events: { type: Array, default: () => [] },
  blocks: { type: Array, default: () => [] },
  startHour: { type: Number, default: 7 },
  endHour:   { type: Number, default: 21 },
  // intervalo de agenda en minutos (20, 30, 60, etc.)
  slotMinutes: { type: Number, default: 30 }
})

// escala visual
const hourPx = 56

const rowsPerHour = computed(() => 60 / props.slotMinutes)
const rowHeight = computed(() => hourPx / rowsPerHour.value)

const hours = computed(() =>
  Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour)
)

const totalSlots = computed(() => {
  const totalMinutes = (props.endHour - props.startHour) * 60
  return totalMinutes / props.slotMinutes
})

const start = computed(() =>
  props.mode === 'week' ? startOfWeek(props.date, { weekStartsOn: 1 }) : startOfDay(props.date)
)

const days = computed(() => {
  const n = props.mode === 'week' ? 7 : 1
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(start.value, i)
    return {
      date: d,
      label: d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })
    }
  })
})

function mapInDay(list, day) {
  const dayStart = new Date(day); dayStart.setHours(0,0,0,0)
  const dayEnd   = new Date(day); dayEnd.setHours(23,59,59,999)
  return (list || []).map(e => {
    const s = new Date(e.start_at)
    const en = new Date(e.end_at)
    const minsFromStart = (s.getHours() * 60 + s.getMinutes()) - (props.startHour * 60)
    const top = Math.max(0, minsFromStart * (hourPx / 60)) // posición en px
    const duration = Math.max(30, differenceInMinutes(en, s))
    const height = duration * (hourPx / 60)
    return { ...e, _top: top, _height: height }
  }).filter(e => {
    const s = new Date(e.start_at); const en = new Date(e.end_at)
    return s <= dayEnd && en >= dayStart
  })
}

function eventsByDay(i) {
  const d = addDays(start.value, i)
  return mapInDay(props.events, d)
}
function blocksByDay(i) {
  const d = addDays(start.value, i)
  return mapInDay(props.blocks, d)
}
function eventsInDay()  { return mapInDay(props.events, start.value) }
function blocksInDay()  { return mapInDay(props.blocks, start.value) }

function pad(n){ return String(n).padStart(2, '0') }

// 👉 click en una franja (slot) del calendario
function handleSlotClick(dayIndex, slotIndex) {
  const baseDay = props.mode === 'week'
    ? addDays(start.value, dayIndex)
    : start.value

  const dt = new Date(baseDay)
  dt.setHours(props.startHour, 0, 0, 0)
  const minutesOffset = slotIndex * props.slotMinutes
  dt.setMinutes(dt.getMinutes() + minutesOffset)

  emit('slot-click', dt.toISOString())
}
</script>
