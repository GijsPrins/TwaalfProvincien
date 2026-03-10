<template>
  <div class="max-w-lg">
    <h2 class="text-lg font-semibold mb-6">{{ isNew ? 'Evenement toevoegen' : 'Evenement bewerken' }}</h2>

    <div v-if="loadingEvent" class="text-sm text-gray-400">Laden…</div>

    <form v-else @submit.prevent="save" class="space-y-4">

      <!-- Always visible -->
      <div>
        <label class="block text-sm font-medium mb-1">Naam evenement</label>
        <input v-model="form.name" type="text" required :class="fieldClass" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Datum</label>
          <input v-model="form.date" type="date" required :class="fieldClass" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Telt mee voor</label>
          <select v-model="form.distance_category" required :class="fieldClass">
            <option value="">Kies medailletrack</option>
            <option v-for="d in DISTANCES" :key="d.value" :value="d.value">
              {{ d.label }} ({{ d.medal }})
            </option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Locatie (startplaats)</label>
        <input
          v-model="form.location"
          type="text"
          :class="fieldClass"
          placeholder="bijv. Tilburg, Centrum"
          @blur="geocodeLocation"
        />
      </div>

      <div>
        <label class="flex items-center gap-2 text-sm font-medium mb-1">
          Provincie
          <span v-if="geocoding" class="text-xs text-gray-400 font-normal">Locatie opzoeken…</span>
          <span v-else-if="geocodedName" class="text-xs text-orange-500 font-normal">Automatisch ingevuld</span>
        </label>
        <select v-model="form.province_id" required :class="fieldClass" @change="geocodedName = ''">
          <option value="">Kies provincie</option>
          <option v-for="p in PROVINCES" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Status</label>
        <select v-model="form.status" required :class="fieldClass">
          <option v-for="(label, value) in STATUS_LABELS" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
      </div>

      <!-- Upcoming: interested / signed_up -->
      <template v-if="isUpcoming">
        <hr class="border-gray-100" />
        <div>
          <label class="block text-sm font-medium mb-1">Website evenement</label>
          <input v-model="form.event_url" type="url" :class="fieldClass" placeholder="https://…" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Inschrijving opent <span class="text-gray-400 font-normal">(optioneel)</span></label>
          <input v-model="form.registration_opens" type="date" :class="fieldClass" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Inschrijfdeadline <span class="text-gray-400 font-normal">(optioneel)</span></label>
          <input v-model="form.registration_deadline" type="date" :class="fieldClass" />
        </div>
      </template>

      <!-- Completed / DNF: actual distance + result fields -->
      <template v-if="isFinished">
        <hr class="border-gray-100" />
        <div>
          <label class="block text-sm font-medium mb-1">Werkelijke afstand</label>
          <select v-model="distancePreset" :class="fieldClass">
            <option value="">Kies afstand</option>
            <option v-for="p in DISTANCE_PRESETS" :key="p.label" :value="p.km">
              {{ p.label }}
            </option>
            <option value="other">Anders…</option>
          </select>
          <input
            v-if="distancePreset === 'other'"
            v-model="form.actual_distance_km"
            type="number"
            step="0.01"
            min="0"
            :class="[fieldClass, 'mt-2']"
            placeholder="Afstand in km, bijv. 16.09"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Eindtijd (chip)</label>
            <input v-model="form.finish_time" type="text" :class="fieldClass" placeholder="bijv. 1:45:32" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Link naar uitslag</label>
            <input v-model="form.timing_url" type="url" :class="fieldClass" placeholder="https://…" />
          </div>
        </div>
      </template>

      <!-- Always: notes -->
      <hr class="border-gray-100" />
      <div>
        <label class="block text-sm font-medium mb-1">Notities</label>
        <textarea v-model="form.notes" rows="3" :class="fieldClass"></textarea>
      </div>

      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <div class="flex items-center justify-between pt-2">
        <div class="flex gap-3">
          <button type="submit" :disabled="busy" class="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50">
            {{ busy ? 'Opslaan…' : 'Opslaan' }}
          </button>
          <router-link to="/admin" class="border border-gray-300 hover:border-gray-400 text-gray-600 font-medium py-2 px-4 rounded-lg text-sm transition-colors">
            Annuleren
          </router-link>
        </div>
        <button
          v-if="!isNew"
          type="button"
          :disabled="busy"
          @click="remove"
          class="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Verwijderen
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PROVINCES, DISTANCES, STATUS_LABELS } from '../../data/provinces.js'
import { useEvent, saveEvent, deleteEvent } from '../../composables/useEvents.js'
import { distanceLabel, formatDate, UPCOMING_STATUSES, FINISHED_STATUSES } from '../../utils/events.js'
import { supabase } from '../../lib/supabase.js'

const route = useRoute()
const router = useRouter()
const isNew = computed(() => !route.params.id)

const DISTANCE_PRESETS = [
  { label: '10 km',               km: 10.0   },
  { label: '10 mijl (16,09 km)',   km: 16.09  },
  { label: 'Halve marathon (21,1 km)', km: 21.1 },
  { label: '30 km',               km: 30.0   },
  { label: 'Marathon (42,2 km)',   km: 42.2   },
]

const fieldClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

const form = ref({
  name: '',
  date: '',
  distance_category: '',
  province_id: '',
  location: '',
  status: 'interested',
  event_url: '',
  registration_opens: '',
  registration_deadline: '',
  finish_time: '',
  timing_url: '',
  actual_distance_km: '',
  notes: '',
})

// Tracks the dropdown selection separately so "other" can show the free input
const distancePreset = ref('')

// When a preset is picked, write the km value into the form
watch(distancePreset, (val) => {
  if (val !== 'other' && val !== '') {
    form.value.actual_distance_km = val
  } else if (val === 'other') {
    form.value.actual_distance_km = ''
  }
})

// Default actual distance to the selected medal track distance
const CATEGORY_DEFAULT_KM = { '10k': 10.0, half: 21.1, marathon: 42.2 }
watch(() => form.value.distance_category, (val) => {
  if (distancePreset.value === '' && val && CATEGORY_DEFAULT_KM[val]) {
    distancePreset.value = CATEGORY_DEFAULT_KM[val]
  }
})

const isUpcoming = computed(() => UPCOMING_STATUSES.includes(form.value.status))
const isFinished = computed(() => FINISHED_STATUSES.includes(form.value.status))

// Nominatim geocoding — auto-fill province from location
const geocoding = ref(false)
const geocodedName = ref('')

// Nominatim sometimes returns Frisian name "Fryslân" — map to our name
const PROVINCE_ALIASES = { 'fryslân': 'Friesland', 'fryslân (friesland)': 'Friesland' }

async function geocodeLocation() {
  if (!form.value.location?.trim() || form.value.province_id) return
  geocoding.value = true
  geocodedName.value = ''
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.value.location)}&countrycodes=nl&format=json&addressdetails=1&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': '12ProvinciesTracker/1.0' } })
    const data = await res.json()
    const state = data[0]?.address?.state
    if (!state) return
    const normalized = state.trim().toLowerCase()
    const matchName = PROVINCE_ALIASES[normalized] ?? state.trim()
    const match = PROVINCES.find(p => p.name.toLowerCase() === matchName.toLowerCase())
    if (match) {
      form.value.province_id = match.id
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
    await loadEvent(route.params.id)
    const data = loadedEvent.value
    if (!data) return
    form.value = {
      name:                  data.name,
      date:                  data.date,
      distance_category:     data.distance_category,
      province_id:           data.province_id,
      location:              data.location ?? '',
      status:                data.status,
      event_url:             data.event_url ?? '',
      registration_opens:    data.registration_opens ?? '',
      registration_deadline: data.registration_deadline ?? '',
      finish_time:           data.finish_time ?? '',
      timing_url:            data.timing_url ?? '',
      actual_distance_km:    data.actual_distance_km ?? '',
      notes:                 data.notes ?? '',
    }
    // Set the preset dropdown to match stored value (or 'other' if it's a custom distance)
    if (data.actual_distance_km) {
      const match = DISTANCE_PRESETS.find(p => p.km === Number(data.actual_distance_km))
      distancePreset.value = match ? match.km : 'other'
    }
  }
})

const VALID_FROM = { '10k': '2024-01-01', half: '2023-01-01', marathon: '2023-01-01' }

async function save() {
  error.value = ''

  // Validate challenge start date
  const validFrom = VALID_FROM[form.value.distance_category]
  if (validFrom && form.value.date < validFrom) {
    error.value = `Evenementen voor de ${distanceLabel(form.value.distance_category)} track tellen pas mee vanaf ${formatDate(validFrom)}.`
    return
  }

  // Warn if a completed event for this province+distance already exists
  if (form.value.status === 'completed') {
    let query = supabase
      .from('events')
      .select('id, name')
      .eq('province_id', form.value.province_id)
      .eq('distance_category', form.value.distance_category)
      .eq('status', 'completed')
    if (!isNew.value) query = query.neq('id', route.params.id)
    const { data: existing } = await query
    if (existing?.length) {
      error.value = `Je hebt al een gelopen ${distanceLabel(form.value.distance_category)} in deze provincie: "${existing[0].name}". Elke provincie telt maar één keer mee.`
      return
    }
  }

  busy.value = true
  try {
    await saveEvent(form.value, isNew.value ? null : route.params.id)
    router.push('/evenementen')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!confirm('Weet je zeker dat je dit evenement wilt verwijderen?')) return
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
</script>
