<template>
  <div>
    <router-link to="/evenementen" class="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
      ← Terug naar evenementen
    </router-link>

    <div v-if="loading" class="text-sm text-gray-400">Laden…</div>
    <div v-else-if="error">
      <p class="text-gray-700 font-medium mb-1">Evenement niet gevonden</p>
      <p class="text-sm text-gray-400">Het evenement bestaat niet of is verwijderd.</p>
    </div>

    <template v-else-if="event">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-semibold">{{ event.name }}</h1>
          <p class="text-gray-500 mt-1">
            {{ event.provinces?.name }}
            <span class="mx-1.5 text-gray-300">·</span>
            {{ distanceLabel(event.distance_category) }}
            <template v-if="event.location">
              <span class="mx-1.5 text-gray-300">·</span>
              {{ event.location }}
            </template>
          </p>
        </div>
        <router-link
          v-if="auth.user"
          :to="`/admin/evenement/${event.id}`"
          class="shrink-0 text-sm border border-gray-300 hover:border-gray-400 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          Bewerken
        </router-link>
      </div>

      <!-- Key info grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-1">Datum</div>
          <div class="font-medium text-sm">{{ formatDate(event.date) }}</div>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-1">Status</div>
          <StatusBadge :status="event.status" />
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-1">Telt mee voor</div>
          <div class="font-medium text-sm">{{ distanceLabel(event.distance_category) }}</div>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-1">Werkelijke afstand</div>
          <div class="font-medium text-sm">
            {{ event.actual_distance_km ? `${event.actual_distance_km} km` : '—' }}
          </div>
        </div>
      </div>

      <!-- Completed / DNF result row -->
      <div v-if="isFinished" class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-1">Eindtijd</div>
          <div class="font-medium text-sm">{{ event.finish_time ?? '—' }}</div>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-1">Uitslag</div>
          <a
            v-if="event.timing_url"
            :href="event.timing_url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-orange-600 hover:underline"
          >
            Bekijken →
          </a>
          <span v-else class="text-sm text-gray-400">—</span>
        </div>
      </div>

      <!-- Upcoming: registration deadline + event website -->
      <div v-if="isUpcoming && (event.registration_opens || event.registration_deadline)" class="grid grid-cols-2 gap-4 mb-6">
        <div v-if="event.registration_opens" class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-1">Inschrijving opent</div>
          <div class="font-medium text-sm">{{ formatDate(event.registration_opens) }}</div>
        </div>
        <div v-if="event.registration_deadline" class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-1">Inschrijfdeadline</div>
          <div class="font-medium text-sm">{{ formatDate(event.registration_deadline) }}</div>
        </div>
      </div>

      <!-- Links -->
      <div class="flex gap-3 flex-wrap mb-6">
        <a
          v-if="event.event_url"
          :href="event.event_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:border-orange-300 px-4 py-2 rounded-lg transition-colors"
        >
          Website evenement →
        </a>
        <a
          v-if="event.strava_activity_id"
          :href="`https://www.strava.com/activities/${event.strava_activity_id}`"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:border-orange-300 px-4 py-2 rounded-lg transition-colors"
        >
          Strava activiteit →
        </a>
      </div>

      <!-- Notes -->
      <div v-if="event.notes" class="bg-white border border-gray-200 rounded-xl p-5">
        <div class="text-xs text-gray-400 mb-2">Notities</div>
        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ event.notes }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEvent } from '../composables/useEvents.js'
import { useAuthStore } from '../stores/auth.js'
import { distanceLabel, formatDate, UPCOMING_STATUSES, FINISHED_STATUSES } from '../utils/events.js'
import StatusBadge from '../components/StatusBadge.vue'

const route = useRoute()
const auth = useAuthStore()
const { event, loading, error, loadEvent } = useEvent()

onMounted(() => loadEvent(route.params.id))

const isUpcoming = computed(() => event.value && UPCOMING_STATUSES.includes(event.value.status))
const isFinished = computed(() => event.value && FINISHED_STATUSES.includes(event.value.status))
</script>
