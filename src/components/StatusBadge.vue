<template>
  <span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full" :class="color">
    {{ STATUS_LABELS[status] ?? status }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { STATUS_LABELS } from '../data/provinces.js'

const props = defineProps({
  status: { type: String, required: true },
})

const color = computed(() => ({
  interested: 'bg-blue-50 text-blue-600',
  signed_up:  'bg-orange-50 text-orange-600',
  completed:  'bg-green-50 text-green-700',
  dns:        'bg-gray-100 text-gray-500',
  dnf:        'bg-red-50 text-red-500',
})[props.status] ?? 'bg-gray-100 text-gray-500')
</script>
