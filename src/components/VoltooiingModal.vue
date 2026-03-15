<template>
  <Teleport to="body">
    <!-- Backdrop (hidden during confetti so confetti fills the whole screen) -->
    <div
      v-if="!showConfetti"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">

        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="text-xs text-orange-500 font-medium uppercase tracking-wide mb-1">
              {{ $t('completion.past_event_label') }}
            </p>
            <h2 class="font-bold text-gray-900 leading-tight">{{ event.name }}</h2>
            <p class="text-sm text-gray-500 mt-0.5">
              {{ event.provinces?.name }} · {{ $t(`distances.${event.distance_category}.label`) }}
            </p>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 ml-2 mt-0.5">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <!-- Outcome choices -->
        <p class="text-sm font-medium mb-3">{{ $t('completion.what_happened') }}</p>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button
            v-for="opt in OUTCOMES"
            :key="opt.value"
            type="button"
            @click="outcome = opt.value"
            :class="[
              'py-2 px-1 rounded-lg border text-sm font-medium text-center transition-colors',
              outcome === opt.value ? opt.activeClass : 'border-gray-200 text-gray-600 hover:border-gray-300',
            ]"
          >
            {{ $t(opt.labelKey) }}
          </button>
        </div>

        <!-- Extra fields for completed -->
        <template v-if="outcome === 'completed'">
          <div class="space-y-3 mb-4">
            <div>
              <label class="block text-sm font-medium mb-1">
                {{ $t('event_form.finish_time') }}
                <span class="text-gray-400 font-normal">({{ $t('common.optional') }})</span>
              </label>
              <input
                v-model="finishTime"
                type="text"
                :class="fieldClass"
                :placeholder="$t('event_form.finish_time_placeholder')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">
                {{ $t('event_form.timing_url') }}
                <span class="text-gray-400 font-normal">({{ $t('common.optional') }})</span>
              </label>
              <input v-model="timingUrl" type="url" :class="fieldClass" placeholder="https://…" />
            </div>
          </div>
        </template>

        <p v-if="error" role="alert" class="text-red-500 text-sm mb-3">{{ error }}</p>

        <div class="flex gap-2">
          <button
            type="button"
            :disabled="!outcome || busy"
            @click="confirm"
            class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-40"
          >
            {{ busy ? $t('completion.confirming') : $t('completion.confirm') }}
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="border border-gray-300 hover:border-gray-400 text-gray-600 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {{ $t('completion.cancel') }}
          </button>
        </div>

      </div>
    </div>

    <!-- Confetti + success overlay (shown after confirming a completed run) -->
    <template v-if="showConfetti">
      <ConfettiCanvas :medal="event.distance_category" @done="$emit('saved')" />
      <div class="fixed inset-0 flex items-center justify-center pointer-events-none" style="z-index: 10000">
        <div class="bg-white rounded-2xl shadow-xl px-8 py-6 text-center pointer-events-auto max-w-xs w-full mx-4">
          <div class="text-6xl mb-3">{{ medalEmoji }}</div>
          <h2 class="text-xl font-bold text-gray-900 mb-1">{{ $t('completion.congrats_title') }}</h2>
          <p class="text-sm text-gray-600">
            {{ $t('completion.medal_earned', { medal: medalLabel, province: event.provinces?.name }) }}
          </p>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfettiCanvas from './ConfettiCanvas.vue'
import { saveEvent } from '../composables/useEvents.js'

const { t } = useI18n()

const props = defineProps({ event: { type: Object, required: true } })
const emit = defineEmits(['close', 'saved'])

const OUTCOMES = [
  { value: 'completed', labelKey: 'completion.outcome_completed', activeClass: 'border-green-500 bg-green-50 text-green-700' },
  { value: 'dns',       labelKey: 'completion.outcome_dns',       activeClass: 'border-gray-400 bg-gray-50 text-gray-700' },
  { value: 'dnf',       labelKey: 'completion.outcome_dnf',       activeClass: 'border-red-300 bg-red-50 text-red-700' },
]

const CATEGORY_DEFAULT_KM = { '10k': 10.0, half: 21.1, marathon: 42.2 }
const MEDAL_EMOJI = { '10k': '🥉', half: '🥈', marathon: '🥇' }

const outcome   = ref(null)
const finishTime = ref('')
const timingUrl  = ref('')
const busy       = ref(false)
const error      = ref('')
const showConfetti = ref(false)

const fieldClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

const medalEmoji = computed(() => MEDAL_EMOJI[props.event.distance_category] ?? '🏅')
const medalLabel = computed(() => t(`distances.${props.event.distance_category}.medal`))

async function confirm() {
  if (!outcome.value) return
  error.value = ''

  if (timingUrl.value && !timingUrl.value.startsWith('https://')) {
    error.value = t('event_form.url_must_be_https')
    return
  }

  busy.value = true
  try {
    await saveEvent({
      ...props.event,
      status:             outcome.value,
      finish_time:        finishTime.value || null,
      timing_url:         timingUrl.value || null,
      actual_distance_km: outcome.value === 'completed'
        ? (CATEGORY_DEFAULT_KM[props.event.distance_category] ?? null)
        : props.event.actual_distance_km,
    }, props.event.id)

    if (outcome.value === 'completed') {
      showConfetti.value = true
    } else {
      emit('saved')
    }
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>
