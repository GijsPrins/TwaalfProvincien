<template>
  <div class="max-w-lg">
    <h2 class="text-lg font-semibold mb-6">{{ isNew ? $t('event_form.title_new') : $t('event_form.title_edit') }}</h2>

    <div v-if="loadingEvent" role="status" aria-live="polite" class="text-sm text-gray-500">{{ $t('common.loading') }}</div>

    <form v-else @submit.prevent="save" class="space-y-4">

      <!-- ── Section: Evenementgegevens ─────────────────────────────────── -->
      <div v-if="!isNew" class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('event_form.section_event_info') }}</h3>
        <span v-if="!canEditCatalog" class="text-xs text-gray-400 italic">{{ $t('event_form.read_only_hint') }}</span>
      </div>

      <fieldset :disabled="!canEditCatalog && !isNew" class="space-y-4">

        <div>
          <label for="ef-name" class="block text-sm font-medium mb-1">{{ $t('event_form.name') }}</label>
          <input id="ef-name" v-model="catalogForm.name" type="text" required :class="fieldClass" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ef-date" class="block text-sm font-medium mb-1">{{ $t('event_form.date') }}</label>
            <input id="ef-date" v-model="catalogForm.date" type="date" required :class="fieldClass" />
          </div>
          <div>
            <label for="ef-distance" class="block text-sm font-medium mb-1">{{ $t('event_form.counts_for') }}</label>
            <select id="ef-distance" v-model="catalogForm.distance_category" required :class="fieldClass">
              <option value="">{{ $t('event_form.pick_track') }}</option>
              <option v-for="d in DISTANCES" :key="d.value" :value="d.value">
                {{ $t(`distances.${d.value}.label`) }} ({{ $t(`distances.${d.value}.medal`) }})
              </option>
            </select>
          </div>
        </div>

        <div>
          <label for="ef-location" class="block text-sm font-medium mb-1">{{ $t('event_form.location') }}</label>
          <input
            id="ef-location"
            v-model="catalogForm.location"
            type="text"
            :class="fieldClass"
            :placeholder="$t('event_form.location_placeholder')"
            @blur="geocodeLocation"
          />
        </div>

        <div>
          <label for="ef-province" class="flex items-center gap-2 text-sm font-medium mb-1">
            {{ $t('event_form.province') }}
            <span v-if="geocoding" class="text-xs text-gray-500 font-normal">{{ $t('event_form.geocoding') }}</span>
            <span v-else-if="geocodedName" class="text-xs text-orange-500 font-normal">{{ $t('event_form.geocoded') }}</span>
          </label>
          <select id="ef-province" v-model="catalogForm.province_id" required :class="fieldClass" @change="geocodedName = ''">
            <option value="">{{ $t('event_form.pick_province') }}</option>
            <option v-for="p in PROVINCES" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>

        <div>
          <label for="ef-event-url" class="block text-sm font-medium mb-1">{{ $t('event_form.event_website') }}</label>
          <input id="ef-event-url" v-model="catalogForm.event_url" type="url" :class="fieldClass" placeholder="https://…" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ef-reg-opens" class="block text-sm font-medium mb-1">
              {{ $t('event_form.registration_opens') }}
              <span class="text-gray-500 font-normal">({{ $t('event_form.optional') }})</span>
            </label>
            <input id="ef-reg-opens" v-model="catalogForm.registration_opens" type="date" :class="fieldClass" />
          </div>
          <div>
            <label for="ef-reg-deadline" class="block text-sm font-medium mb-1">
              {{ $t('event_form.registration_deadline') }}
              <span class="text-gray-500 font-normal">({{ $t('event_form.optional') }})</span>
            </label>
            <input id="ef-reg-deadline" v-model="catalogForm.registration_deadline" type="date" :class="fieldClass" />
          </div>
        </div>

      </fieldset>

      <!-- ── Section: Mijn deelname (edit only) ────────────────────────── -->
      <template v-if="!isNew">
        <hr class="border-gray-200 mt-2" />
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('event_form.section_participation') }}</h3>

        <div>
          <label for="ef-status" class="block text-sm font-medium mb-1">{{ $t('event_form.status') }}</label>
          <select id="ef-status" v-model="participationForm.status" required :class="fieldClass">
            <option v-for="key in statusKeys" :key="key" :value="key">
              {{ $t(`statuses.${key}`) }}
            </option>
          </select>
        </div>

        <!-- Completed / DNF: actual distance + result fields -->
        <template v-if="isFinished">
          <div>
            <label for="ef-dist-preset" class="block text-sm font-medium mb-1">{{ $t('event_form.actual_distance') }}</label>
            <select id="ef-dist-preset" v-model="distancePreset" :class="fieldClass">
              <option value="">{{ $t('event_form.pick_distance') }}</option>
              <option v-for="p in distancePresets" :key="p.label" :value="p.km">
                {{ p.label }}
              </option>
              <option value="other">{{ $t('event_form.distance_other') }}</option>
            </select>
            <input
              v-if="distancePreset === 'other'"
              v-model="participationForm.actual_distance_km"
              type="number"
              step="0.01"
              min="0"
              :class="[fieldClass, 'mt-2']"
              :placeholder="$t('event_form.distance_custom_placeholder')"
              :aria-label="$t('event_form.distance_custom_placeholder')"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ef-finish-time" class="block text-sm font-medium mb-1">{{ $t('event_form.finish_time') }}</label>
              <input id="ef-finish-time" v-model="participationForm.finish_time" type="text" :class="fieldClass" :placeholder="$t('event_form.finish_time_placeholder')" />
            </div>
            <div>
              <label for="ef-timing-url" class="block text-sm font-medium mb-1">{{ $t('event_form.timing_url') }}</label>
              <input id="ef-timing-url" v-model="participationForm.timing_url" type="url" :class="fieldClass" placeholder="https://…" />
            </div>
          </div>
        </template>

        <!-- Notes -->
        <div>
          <label for="ef-notes" class="block text-sm font-medium mb-1">{{ $t('event_form.notes') }}</label>
          <textarea id="ef-notes" v-model="participationForm.notes" rows="3" :class="fieldClass"></textarea>
        </div>
      </template>

      <!-- On create: hint about auto-status -->
      <p v-if="isNew" class="text-xs text-gray-500">{{ $t('event_form.create_status_hint') }}</p>

      <p v-if="error" role="alert" class="text-red-500 text-sm">{{ error }}</p>

      <div class="flex items-center justify-between pt-2">
        <div class="flex gap-3">
          <button type="submit" :disabled="busy" class="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50">
            {{ busy ? $t('event_form.saving') : $t('event_form.save') }}
          </button>
          <router-link to="/admin" class="border border-gray-300 hover:border-gray-400 text-gray-600 font-medium py-2 px-4 rounded-lg text-sm transition-colors">
            {{ $t('event_form.cancel') }}
          </router-link>
        </div>
        <div class="flex gap-3">
          <!-- Leave participation (any participant, edit only) -->
          <button
            v-if="!isNew && hasParticipation"
            type="button"
            :disabled="busy"
            @click="removeParticipation"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {{ $t('event_form.delete_participation') }}
          </button>
          <!-- Delete catalog event (creator / admin only) -->
          <button
            v-if="!isNew && canEditCatalog"
            type="button"
            :disabled="busy"
            @click="remove"
            class="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            {{ $t('event_form.delete') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { PROVINCES, DISTANCES, STATUS_LABELS } from '../../data/provinces.js'
import { useEvent, saveCatalogEvent, saveParticipation, leaveEvent, deleteEvent } from '../../composables/useEvents.js'
import { useAuthStore } from '../../stores/auth.js'
import { distanceLabel, formatDate, FINISHED_STATUSES } from '../../utils/events.js'
import { supabase } from '../../lib/supabase.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isNew = computed(() => !route.params.id)

const statusKeys = Object.keys(STATUS_LABELS)

const distancePresets = computed(() => [
  { label: t('distance_presets.10km'),     km: 10.0   },
  { label: t('distance_presets.10mi'),     km: 16.09  },
  { label: t('distance_presets.half'),     km: 21.1   },
  { label: t('distance_presets.30km'),     km: 30.0   },
  { label: t('distance_presets.marathon'), km: 42.2   },
])

const fieldClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

// Catalog fields (shared event data)
const catalogForm = ref({
  name: '',
  date: '',
  distance_category: '',
  province_id: '',
  location: '',
  event_url: '',
  registration_opens: '',
  registration_deadline: '',
})

// Participation fields (per-user)
const participationForm = ref({
  status: 'interested',
  finish_time: '',
  timing_url: '',
  actual_distance_km: '',
  notes: '',
})

const hasParticipation = ref(false)

// Tracks the dropdown selection for actual_distance_km
const distancePreset = ref('')

watch(distancePreset, (val) => {
  if (val !== 'other' && val !== '') {
    participationForm.value.actual_distance_km = val
  } else if (val === 'other') {
    participationForm.value.actual_distance_km = ''
  }
})

// Default actual distance to the selected medal track distance
const CATEGORY_DEFAULT_KM = { '10k': 10.0, half: 21.1, marathon: 42.2 }
watch(() => catalogForm.value.distance_category, (val) => {
  if (distancePreset.value === '' && val && CATEGORY_DEFAULT_KM[val]) {
    distancePreset.value = CATEGORY_DEFAULT_KM[val]
  }
})

const isFinished = computed(() => FINISHED_STATUSES.includes(participationForm.value.status))

// Access control
const isCreator = computed(() => auth.user?.id === loadedEvent.value?.created_by)
const canEditCatalog = computed(() => isCreator.value || auth.isAdmin)

// Nominatim geocoding — auto-fill province from location
const geocoding = ref(false)
const geocodedName = ref('')

const PROVINCE_ALIASES = { 'fryslân': 'Friesland', 'fryslân (friesland)': 'Friesland' }

async function geocodeLocation() {
  if (!catalogForm.value.location?.trim() || catalogForm.value.province_id) return
  geocoding.value = true
  geocodedName.value = ''
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(catalogForm.value.location)}&countrycodes=nl&format=json&addressdetails=1&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': '12ProvinciesTracker/1.0' } })
    const data = await res.json()
    const state = data[0]?.address?.state
    if (!state) return
    const normalized = state.trim().toLowerCase()
    const matchName = PROVINCE_ALIASES[normalized] ?? state.trim()
    const match = PROVINCES.find(p => p.name.toLowerCase() === matchName.toLowerCase())
    if (match) {
      catalogForm.value.province_id = match.id
      geocodedName.value = match.name
    }
  } catch {
    // Silently fail — user can pick manually
  } finally {
    geocoding.value = false
  }
}

const busy = ref(false)
const error = ref('')
const { event: loadedEvent, loading: loadingEvent, loadEvent } = useEvent()

onMounted(async () => {
  if (!isNew.value) {
    await loadEvent(route.params.id, auth.user?.id)
    const data = loadedEvent.value
    if (!data) return

    catalogForm.value = {
      name:                  data.name,
      date:                  data.date,
      distance_category:     data.distance_category,
      province_id:           data.province_id,
      location:              data.location ?? '',
      event_url:             data.event_url ?? '',
      registration_opens:    data.registration_opens ?? '',
      registration_deadline: data.registration_deadline ?? '',
    }

    const p = data.participation
    hasParticipation.value = !!p
    if (p) {
      participationForm.value = {
        status:             p.status,
        finish_time:        p.finish_time ?? '',
        timing_url:         p.timing_url ?? '',
        actual_distance_km: p.actual_distance_km ?? '',
        notes:              p.notes ?? '',
      }
      if (p.actual_distance_km) {
        const match = distancePresets.value.find(preset => preset.km === Number(p.actual_distance_km))
        distancePreset.value = match ? match.km : 'other'
      }
    }
  }
})

const VALID_FROM = { '10k': '2024-01-01', half: '2023-01-01', marathon: '2023-01-01' }

async function save() {
  error.value = ''

  // Validate URLs must use https
  const urlsToCheck = [
    catalogForm.value.event_url,
    participationForm.value.timing_url,
  ]
  if (urlsToCheck.some(v => v?.trim() && !v.trim().startsWith('https://'))) {
    error.value = t('event_form.url_must_be_https')
    return
  }

  // Validate challenge start date (only when we can edit the catalog)
  if (canEditCatalog.value || isNew.value) {
    const validFrom = VALID_FROM[catalogForm.value.distance_category]
    if (validFrom && catalogForm.value.date < validFrom) {
      error.value = t('event_form.valid_from_error', {
        track: distanceLabel(catalogForm.value.distance_category),
        date: formatDate(validFrom),
      })
      return
    }
  }

  // Warn if a completed participation for this province+distance already exists
  if (!isNew.value && participationForm.value.status === 'completed') {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: existing } = await supabase
      .from('event_participations')
      .select('id, events!inner(name, province_id, distance_category)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('events.province_id', catalogForm.value.province_id)
      .eq('events.distance_category', catalogForm.value.distance_category)
      .neq('event_id', route.params.id)
    if (existing?.length) {
      error.value = t('event_form.duplicate_error', {
        track: distanceLabel(catalogForm.value.distance_category),
        name: existing[0].events?.name,
      })
      return
    }
  }

  busy.value = true
  try {
    if (isNew.value) {
      // Create catalog event + auto-participation, then redirect to edit form
      const newId = await saveCatalogEvent(catalogForm.value)
      router.push(`/admin/evenement/${newId}`)
    } else {
      // Update catalog (if allowed) and always update participation
      if (canEditCatalog.value) {
        await saveCatalogEvent(catalogForm.value, route.params.id)
      }
      if (hasParticipation.value) {
        await saveParticipation(participationForm.value, route.params.id)
      }
      router.push('/evenementen')
    }
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!confirm(t('event_form.confirm_delete'))) return
  busy.value = true
  try {
    await deleteEvent(route.params.id)
    router.push('/evenementen')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function removeParticipation() {
  if (!confirm(t('event_form.confirm_leave'))) return
  busy.value = true
  try {
    await leaveEvent(route.params.id)
    router.push('/evenementen')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>
