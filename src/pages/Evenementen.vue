<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <h1 class="text-2xl font-semibold">{{ $t('events.title') }}</h1>
      <router-link
        v-if="auth.user"
        to="/admin/evenement/nieuw"
        class="text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        {{ $t('events.new') }}
      </router-link>
    </div>
    <p class="text-gray-500 text-sm mb-6">{{ $t('events.subtitle') }}</p>

    <!-- Status filters -->
    <div class="flex gap-2 flex-wrap mb-6" role="group" :aria-label="$t('events.filter_by_status')">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        @click="activeStatus = f.value"
        :aria-pressed="activeStatus === f.value"
        class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
        :class="activeStatus === f.value
          ? 'bg-orange-100 text-orange-700'
          : 'text-gray-500 hover:bg-gray-100'"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="loading" role="status" aria-live="polite" class="text-sm text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="error" role="alert" class="text-sm text-red-500">{{ error }}</div>

    <template v-else>
      <div v-if="filtered.length === 0" class="text-sm text-gray-500">
        {{ $t('events.none_found') }}
        <router-link v-if="auth.user" to="/admin/evenement/nieuw" class="text-orange-600 hover:underline">
          {{ $t('events.add_one') }}
        </router-link>
      </div>

      <ul v-else class="space-y-3">
        <li v-for="ev in filtered" :key="ev.id">
          <router-link
            :to="`/evenementen/${ev.id}`"
            class="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-orange-300 transition-colors"
          >
            <div class="min-w-0">
              <div class="font-medium truncate">{{ ev.name }}</div>
              <div class="text-sm text-gray-500 mt-0.5">
                {{ ev.provinces?.name }}
                <span class="mx-1.5 text-gray-300">·</span>
                {{ distanceLabel(ev.distance_category) }}
                <template v-if="ev.location">
                  <span class="mx-1.5 text-gray-300">·</span>
                  {{ ev.location }}
                </template>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1.5 shrink-0 ml-4">
              <span class="text-sm text-gray-600">{{ formatDate(ev.date) }}</span>
              <StatusBadge :status="ev.status" />
            </div>
          </router-link>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { STATUS_LABELS } from '../data/provinces.js'
import { useEvents } from '../composables/useEvents.js'
import { useAuthStore } from '../stores/auth.js'
import { distanceLabel, formatDate } from '../utils/events.js'
import StatusBadge from '../components/StatusBadge.vue'

const { t } = useI18n()
const auth = useAuthStore()
const activeStatus = ref('all')
const { events, loading, error, loadAllEvents } = useEvents()

onMounted(loadAllEvents)

const statusFilters = computed(() => [
  { value: 'all', label: t('common.all') },
  ...Object.keys(STATUS_LABELS).map(value => ({ value, label: t(`statuses.${value}`) })),
])

const filtered = computed(() => {
  if (activeStatus.value === 'all') return events.value
  return events.value.filter(ev => ev.status === activeStatus.value)
})
</script>
