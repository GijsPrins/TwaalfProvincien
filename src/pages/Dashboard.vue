<template>
  <div>
    <h1 class="text-2xl font-semibold mb-1">{{ $t('dashboard.title') }}</h1>
    <p class="text-gray-500 text-sm mb-6">{{ $t('dashboard.subtitle') }}</p>

    <div v-if="loading" role="status" aria-live="polite" class="text-sm text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="error" role="alert" class="text-sm text-red-500">{{ error }}</div>

    <template v-else>

      <!-- Past-due events (logged-in only) -->
      <div v-if="pastDueEvents.length" class="mb-6">
        <h2 class="text-sm font-medium text-green-700 mb-2">{{ $t('completion.past_events_heading') }}</h2>
        <div class="space-y-2">
          <button
            v-for="event in pastDueEvents"
            :key="event.id"
            type="button"
            @click="selectedEvent = event"
            class="w-full flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-xl hover:border-green-400 hover:bg-green-100 transition-colors text-left"
          >
            <div>
              <div class="font-medium text-sm text-gray-900">{{ event.name }}</div>
              <div class="text-xs text-gray-500 mt-0.5">
                {{ event.provinces?.name }} · {{ $t(`distances.${event.distance_category}.label`) }} · {{ formatDateShort(event.date) }}
              </div>
            </div>
            <span class="text-green-700 text-sm font-medium shrink-0 ml-3">{{ $t('completion.what_happened_short') }} →</span>
          </button>
        </div>
      </div>

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
            <h2 class="font-medium text-sm">{{ selectedProvince?.name ?? $t('dashboard.provinces') }}</h2>
            <div class="flex gap-1.5" role="group" :aria-label="$t('dashboard.filter_by_distance')">
              <button
                v-for="d in distanceFilters"
                :key="d.value"
                @click="activeDistance = d.value"
                :aria-pressed="activeDistance === d.value"
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
          <p v-if="selectedProvince" class="text-xs text-gray-500 text-center mt-2">{{ $t('dashboard.click_to_deselect') }}</p>
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
              {{ selectedProvince ? $t('dashboard.upcoming_in', { province: selectedProvince.name }) : $t('dashboard.upcoming') }}
            </h2>
            <ul v-if="upcoming.length" class="space-y-2">
              <li v-for="ev in upcoming" :key="ev.id">
                <router-link
                  :to="`/evenementen/${ev.id}`"
                  class="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors -mx-1"
                >
                  <div class="min-w-0">
                    <div class="font-medium text-sm truncate">{{ ev.name }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">
                      {{ ev.provinces?.name }} · {{ distanceLabel(ev.distance_category) }}
                    </div>
                  </div>
                  <div class="text-right shrink-0 ml-3">
                    <div class="text-xs text-gray-500">{{ formatDateShort(ev.date) }}</div>
                    <StatusBadge :status="ev.status" class="mt-1" />
                  </div>
                </router-link>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">
              {{ selectedProvince ? $t('dashboard.no_upcoming_in', { province: selectedProvince.name }) : $t('dashboard.no_upcoming') }}
              <router-link v-if="auth.user && !selectedProvince" to="/admin/evenement/nieuw" class="text-orange-600 hover:underline">{{ $t('dashboard.add_question') }}</router-link>
            </p>
          </div>

        </div>
      </div>
      <VoltooiingModal
        v-if="selectedEvent"
        :event="selectedEvent"
        @close="selectedEvent = null"
        @saved="onSaved"
      />

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DISTANCES, PROVINCES } from '../data/provinces.js'
import { useMyEvents } from '../composables/useEvents.js'
import { useAuthStore } from '../stores/auth.js'
import { distanceLabel, formatDate, UPCOMING_STATUSES } from '../utils/events.js'
import ProgressCard from '../components/ProgressCard.vue'
import NetherlandsMap from '../components/NetherlandsMap.vue'
import StatusBadge from '../components/StatusBadge.vue'
import VoltooiingModal from '../components/VoltooiingModal.vue'

const { t } = useI18n()
const activeDistance = ref('all')
const selectedProvinceId = ref(null)
const auth = useAuthStore()
const { events, loading, error, loadAllEvents } = useMyEvents(auth.user?.id)

const today = new Date().toISOString().slice(0, 10)
const selectedEvent = ref(null)

const pastDueEvents = computed(() =>
  auth.user
    ? events.value.filter(e => e.date <= today && ['interested', 'signed_up'].includes(e.status))
    : []
)

async function onSaved() {
  selectedEvent.value = null
  await loadAllEvents()
}

onMounted(loadAllEvents)

const distanceFilters = computed(() => [
  { value: 'all', label: t('common.all') },
  ...DISTANCES.map(d => ({ value: d.value, label: t(`distances.${d.value}.label`) })),
])

const selectedProvince = computed(() =>
  selectedProvinceId.value ? PROVINCES.find(p => p.id === selectedProvinceId.value) : null
)

const completed = computed(() => events.value.filter(ev => ev.status === 'completed'))

const upcoming = computed(() => {
  const evs = events.value.filter(ev => UPCOMING_STATUSES.includes(ev.status))
  if (selectedProvinceId.value) {
    return evs.filter(ev => ev.province_id === selectedProvinceId.value)
  }
  return evs.slice(0, 3)
})

const completedPerDistance = computed(() => {
  const count = {}
  for (const d of DISTANCES) {
    count[d.value] = new Set(
      completed.value.filter(ev => ev.distance_category === d.value).map(ev => ev.province_id)
    ).size
  }
  return count
})

const upcomingProvinces = computed(() => {
  const result = {}
  for (const d of DISTANCES) {
    result[d.value] = new Set(
      events.value
        .filter(ev => UPCOMING_STATUSES.includes(ev.status) && ev.distance_category === d.value)
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

function formatDateShort(date) {
  return formatDate(date, { day: 'numeric', month: 'short' })
}
</script>
