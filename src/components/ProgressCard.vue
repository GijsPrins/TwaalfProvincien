<template>
  <div class="bg-white border border-gray-200 rounded-xl" :class="compact ? 'p-3' : 'p-5'">
    <div class="flex items-center justify-between mb-2">
      <span :class="compact ? 'text-xs font-medium text-gray-500' : 'text-sm font-medium'">
        {{ compact ? distance.medal : distance.label }}
      </span>
      <span v-if="!compact" class="text-xs font-medium px-2 py-0.5 rounded-full" :class="medalColor">
        {{ distance.medal }}
      </span>
    </div>

    <!-- Fixed-height content area prevents layout shift when switching modes -->
    <div :class="compact ? '' : 'min-h-[3.5rem] flex flex-col justify-center'">

      <!-- Province selected: show event or "geen medaille" -->
      <template v-if="provinceSelected">
        <div v-if="event" class="min-w-0">
          <router-link
            :to="`/evenementen/${event.id}`"
            class="font-medium text-sm leading-tight hover:text-orange-600 transition-colors line-clamp-2"
          >{{ event.name }}</router-link>
          <div class="text-xs text-gray-400 mt-1">{{ event.finish_time ?? formatDate(event.date) }}</div>
        </div>
        <div v-else class="text-sm text-gray-400">Geen medaille</div>
      </template>

      <!-- Normal mode: x/12 + progress bar -->
      <template v-else>
        <div :class="compact ? 'text-xl font-bold tabular-nums' : 'text-3xl font-bold tabular-nums mb-1'">
          {{ completed }}<span :class="compact ? 'text-sm font-normal text-gray-400' : 'text-lg font-normal text-gray-400'">/12</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full mt-2" :class="compact ? 'h-1.5' : 'h-2'">
          <div
            class="rounded-full transition-all"
            :class="[barColor, compact ? 'h-1.5' : 'h-2']"
            :style="{ width: `${(completed / 12) * 100}%` }"
          ></div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  distance:        Object,
  completed:       { type: Number, default: 0 },
  compact:         { type: Boolean, default: false },
  provinceSelected: { type: Boolean, default: false },
  event:           { type: Object, default: null },
})

const medalColor = computed(() => ({
  '10k':    'bg-amber-100 text-amber-700',
  half:     'bg-gray-100 text-gray-600',
  marathon: 'bg-yellow-100 text-yellow-700',
})[props.distance.value])

const barColor = computed(() => ({
  '10k':    'bg-amber-500',
  half:     'bg-gray-400',
  marathon: 'bg-yellow-500',
})[props.distance.value])

function formatDate(date) {
  return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
