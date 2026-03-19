<template>
  <div>
    <router-link to="/evenementen" class="text-sm text-gray-500 hover:text-gray-600 mb-6 inline-block">
      {{ $t('event_detail.back') }}
    </router-link>

    <div v-if="loading" role="status" aria-live="polite" class="text-sm text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="error" role="alert">
      <p class="text-gray-700 font-medium mb-1">{{ $t('event_detail.not_found_title') }}</p>
      <p class="text-sm text-gray-500">{{ $t('event_detail.not_found_message') }}</p>
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
          v-if="auth.user && event.participation"
          :to="`/admin/evenement/${event.id}`"
          class="shrink-0 text-sm border border-gray-300 hover:border-gray-400 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          {{ $t('event_detail.edit') }}
        </router-link>
      </div>

      <!-- Key info grid — catalog fields -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-500 mb-1">{{ $t('event_detail.date') }}</div>
          <div class="font-medium text-sm">{{ formatDate(event.date) }}</div>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-500 mb-1">{{ $t('event_detail.counts_for') }}</div>
          <div class="font-medium text-sm">{{ distanceLabel(event.distance_category) }}</div>
        </div>
        <div v-if="event.registration_opens || event.registration_deadline" class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="text-xs text-gray-500 mb-1">
            {{ event.registration_opens ? $t('event_detail.registration_opens') : $t('event_detail.registration_deadline') }}
          </div>
          <div class="font-medium text-sm">{{ formatDate(event.registration_opens || event.registration_deadline) }}</div>
        </div>
      </div>

      <!-- Event website link -->
      <div v-if="event.event_url" class="flex gap-3 flex-wrap mb-6">
        <a
          :href="event.event_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:border-orange-300 px-4 py-2 rounded-lg transition-colors"
        >
          {{ $t('event_detail.event_website') }}
        </a>
      </div>

      <!-- ── My participation section ──────────────────────────────────── -->
      <template v-if="auth.user">

        <!-- Has participation: show details -->
        <div v-if="event.participation" class="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-medium text-sm">{{ $t('event_detail.my_participation') }}</h2>
            <router-link
              :to="`/admin/evenement/${event.id}`"
              class="text-xs text-orange-600 hover:underline"
            >
              {{ $t('event_detail.edit_participation') }}
            </router-link>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-gray-500 mb-1">{{ $t('event_detail.status') }}</div>
              <StatusBadge :status="event.status" />
            </div>
            <div v-if="event.actual_distance_km">
              <div class="text-xs text-gray-500 mb-1">{{ $t('event_detail.actual_distance') }}</div>
              <div class="font-medium text-sm">{{ event.actual_distance_km }} km</div>
            </div>
          </div>

          <template v-if="isFinished">
            <div class="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div class="text-xs text-gray-500 mb-1">{{ $t('event_detail.finish_time') }}</div>
                <div class="font-medium text-sm">{{ event.finish_time ?? '—' }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">{{ $t('event_detail.result') }}</div>
                <a
                  v-if="event.timing_url"
                  :href="event.timing_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-orange-600 hover:underline"
                >
                  {{ $t('event_detail.view') }}
                </a>
                <span v-else class="text-sm text-gray-500">—</span>
              </div>
            </div>
          </template>

          <div v-if="event.strava_activity_id" class="mt-4">
            <a
              :href="`https://www.strava.com/activities/${event.strava_activity_id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:underline"
            >
              {{ $t('event_detail.strava_activity') }}
            </a>
          </div>

          <div v-if="event.notes" class="mt-4">
            <div class="text-xs text-gray-500 mb-1">{{ $t('event_detail.notes') }}</div>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ event.notes }}</p>
          </div>
        </div>

        <!-- No participation: show register button -->
        <div v-else class="border border-dashed border-gray-300 rounded-xl p-5 mb-6 flex items-center justify-between">
          <p class="text-sm text-gray-500">{{ $t('event_detail.join_event') }}</p>
          <button
            type="button"
            :disabled="joining"
            @click="join"
            class="shrink-0 ml-4 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {{ $t('events.join') }}
          </button>
        </div>

      </template>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEvent, joinEvent } from '../composables/useEvents.js'
import { useAuthStore } from '../stores/auth.js'
import { distanceLabel, formatDate, FINISHED_STATUSES } from '../utils/events.js'
import StatusBadge from '../components/StatusBadge.vue'

const route = useRoute()
const auth = useAuthStore()
const { event, loading, error, loadEvent } = useEvent()

onMounted(() => loadEvent(route.params.id, auth.user?.id))

const isFinished = computed(() => event.value && FINISHED_STATUSES.includes(event.value.status))

const joining = ref(false)

async function join() {
  joining.value = true
  try {
    await joinEvent(route.params.id)
    await loadEvent(route.params.id, auth.user?.id)
  } finally {
    joining.value = false
  }
}
</script>
