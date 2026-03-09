import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

function baseQuery() {
  return supabase
    .from('events')
    .select(`
      id,
      name,
      date,
      location,
      province_id,
      distance_category,
      status,
      finish_time,
      timing_url,
      strava_activity_id,
      notes,
      event_url,
      registration_opens,
      registration_deadline,
      actual_distance_km,
      created_at,
      provinces ( name )
    `)
    .order('date', { ascending: true })
}

export function useEvents() {
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadAllEvents() {
    loading.value = true
    error.value = null
    const { data, error: err } = await baseQuery()
    loading.value = false
    if (err) { error.value = err.message; return }
    events.value = data
  }

  return { events, loading, error, loadAllEvents }
}

export function useEvent() {
  const event = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function loadEvent(id) {
    loading.value = true
    error.value = null
    const { data, error: err } = await baseQuery().eq('id', id).single()
    loading.value = false
    if (err) { error.value = err.message; return }
    event.value = data
  }

  return { event, loading, error, loadEvent }
}

export async function saveEvent(form, id = null) {
  const row = {
    name:              form.name,
    date:              form.date,
    location:          form.location || null,
    province_id:       Number(form.province_id),
    distance_category: form.distance_category,
    status:            form.status,
    finish_time:            form.finish_time || null,
    timing_url:             form.timing_url || null,
    notes:                  form.notes || null,
    event_url:              form.event_url || null,
    registration_opens:     form.registration_opens || null,
    registration_deadline:  form.registration_deadline || null,
    actual_distance_km:     form.actual_distance_km ? Number(form.actual_distance_km) : null,
    updated_at:             new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase.from('events').update(row).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('events').insert(row)
    if (error) throw error
  }
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
