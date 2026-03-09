<template>
  <div>
    <h1 class="text-2xl font-semibold mb-1">12 Provincies Tracker</h1>
    <p class="text-gray-500 text-sm mb-6">Voortgang per medailletrack</p>

    <div v-if="loading" class="text-sm text-gray-400">Laden…</div>
    <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>

    <template v-else>
      <!-- Mobile: progress cards on top -->
      <div class="grid grid-cols-3 gap-3 mb-6 lg:hidden">
        <ProgressCard
          v-for="distance in DISTANCES"
          :key="distance.value"
          :distance="distance"
          :completed="completedPerDistance[distance.value] ?? 0"
          :province-selected="!!selectedProvince"
          :event="provinceMedalEvents[distance.value] ?? null"
          compact
        />
      </div>

      <!-- Main layout: map left, sidebar right -->
      <div class="flex flex-col lg:flex-row gap-6">

        <!-- Left: map — self-start prevents it from stretching to match sidebar height -->
        <div class="lg:w-[45%] lg:self-start bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-medium text-sm">{{ selectedProvince?.name ?? 'Provincies' }}</h2>
            <div class="flex gap-1.5">
              <button
                v-for="d in [{ value: 'all', label: 'Alle' }, ...DISTANCES]"
                :key="d.value"
                @click="activeDistance = d.value"
                class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                :class="activeDistance === d.value
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-500 hover:bg-gray-100'"
              >
                {{ d.label }}
              </button>
            </div>
          </div>
          <div class="flex-1 flex items-center">
            <NetherlandsMap
              :completed-provinces="completedProvinces"
              :upcoming-provinces="upcomingProvinces"
              :active-distance="activeDistance"
              v-model:selected-province-id="selectedProvinceId"
            />
          </div>
          <p v-if="selectedProvince" class="text-xs text-gray-400 text-center mt-2">Klik opnieuw om selectie op te heffen</p>
        </div>

        <!-- Right: sidebar -->
        <div class="lg:w-[55%] flex flex-col gap-4">

          <!-- Progress cards — desktop only -->
          <div class="hidden lg:flex flex-col gap-3">
            <ProgressCard
              v-for="distance in DISTANCES"
              :key="distance.value"
              :distance="distance"
              :completed="completedPerDistance[distance.value] ?? 0"
              :province-selected="!!selectedProvince"
              :event="provinceMedalEvents[distance.value] ?? null"
            />
          </div>

          <!-- Upcoming events -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h2 class="font-medium text-sm mb-3">
              {{ selectedProvince ? `Aankomend in ${selectedProvince.name}` : 'Aankomend' }}
            </h2>
            <div v-if="upcoming.length" class="space-y-2">
              <router-link
                v-for="ev in upcoming"
                :key="ev.id"
                :to="`/evenementen/${ev.id}`"
                class="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors -mx-1"
              >
                <div class="min-w-0">
                  <div class="font-medium text-sm truncate">{{ ev.name }}</div>
                  <div class="text-xs text-gray-400 mt-0.5">
                    {{ ev.provinces?.name }} · {{ distanceLabel(ev.distance_category) }}
                  </div>
                </div>
                <div class="text-right shrink-0 ml-3">
                  <div class="text-xs text-gray-500">{{ formatDate(ev.date) }}</div>
                  <StatusBadge :status="ev.status" class="mt-1" />
                </div>
              </router-link>
            </div>
            <p v-else class="text-sm text-gray-400">
              {{ selectedProvince ? `Geen aankomende evenementen in ${selectedProvince.name}.` : 'Geen aankomende evenementen.' }}
              <router-link v-if="auth.user && !selectedProvince" to="/admin/evenement/nieuw" class="text-orange-600 hover:underline">Toevoegen?</router-link>
            </p>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DISTANCES, PROVINCES } from '../data/provinces.js'
import { useEvents } from '../composables/useEvents.js'
import { useAuthStore } from '../stores/auth.js'
import ProgressCard from '../components/ProgressCard.vue'
import NetherlandsMap from '../components/NetherlandsMap.vue'
import StatusBadge from '../components/StatusBadge.vue'

const activeDistance = ref('all')
const selectedProvinceId = ref(null)
const { events, loading, error, loadAllEvents } = useEvents()
const auth = useAuthStore()

onMounted(loadAllEvents)

const selectedProvince = computed(() =>
  selectedProvinceId.value ? PROVINCES.find(p => p.id === selectedProvinceId.value) : null
)

const completed = computed(() => events.value.filter(ev => ev.status === 'completed'))

const upcoming = computed(() => {
  const evs = events.value.filter(ev => ['interested', 'signed_up'].includes(ev.status))
  if (selectedProvinceId.value) {
    return evs.filter(ev => ev.province_id === selectedProvinceId.value)
  }
  return evs.slice(0, 3)
})

const completedPerDistance = computed(() => {
  const count = {}
  for (const ev of completed.value) {
    count[ev.distance_category] = (count[ev.distance_category] ?? 0) + 1
  }
  return count
})

const upcomingProvinces = computed(() => {
  const result = {}
  for (const d of DISTANCES) {
    result[d.value] = new Set(
      events.value
        .filter(ev => ['interested', 'signed_up'].includes(ev.status) && ev.distance_category === d.value)
        .map(ev => ev.province_id)
    )
  }
  return result
})

const completedProvinces = computed(() => {
  const result = {}
  for (const d of DISTANCES) {
    result[d.value] = new Set(
      completed.value
        .filter(ev => ev.distance_category === d.value)
        .map(ev => ev.province_id)
    )
  }
  return result
})

// For selected province: find the completed event per distance category
const provinceMedalEvents = computed(() => {
  if (!selectedProvinceId.value) return {}
  const result = {}
  for (const d of DISTANCES) {
    result[d.value] = completed.value.find(
      ev => ev.province_id === selectedProvinceId.value && ev.distance_category === d.value
    ) ?? null
  }
  return result
})

function distanceLabel(value) {
  return DISTANCES.find(d => d.value === value)?.label ?? value
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}
</script>
