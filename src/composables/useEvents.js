import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

// ── Catalog fields selected from the events table ────────────────────────────
const CATALOG_SELECT = `
  id,
  name,
  date,
  location,
  province_id,
  distance_category,
  event_url,
  registration_opens,
  registration_deadline,
  created_by,
  created_at,
  updated_at,
  provinces ( name )
`

// ── Participation fields selected from the joined table ───────────────────────
const PARTICIPATION_FIELDS = `
    id,
    status,
    finish_time,
    timing_url,
    actual_distance_km,
    strava_activity_id,
    notes,
    created_at,
    updated_at`

const PARTICIPATION_SELECT = `event_participations ( ${PARTICIPATION_FIELDS} )`
const PARTICIPATION_INNER_SELECT = `event_participations!inner ( ${PARTICIPATION_FIELDS} )`

// ── Flatten a raw Supabase row so participation fields bubble up to the top ──
// This keeps all existing template expressions (ev.status, ev.finish_time, …)
// working without change.
function flattenParticipation(row) {
  const p = row.event_participations?.[0] ?? null
  return {
    ...row,
    event_participations: undefined, // remove raw array
    participation: p,
    // Convenience aliases — null when user has no participation
    status:             p?.status             ?? null,
    finish_time:        p?.finish_time        ?? null,
    timing_url:         p?.timing_url         ?? null,
    actual_distance_km: p?.actual_distance_km ?? null,
    strava_activity_id: p?.strava_activity_id ?? null,
    notes:              p?.notes              ?? null,
  }
}

// ── Base query: catalog events only (public, no participation) ────────────────
function baseQuery() {
  return supabase
    .from('events')
    .select(CATALOG_SELECT)
    .order('date', { ascending: true })
}

// ── Query with left-join participation for a specific user ────────────────────
// Events without a participation row will have participation: null
function baseQueryWithParticipation(userId) {
  return supabase
    .from('events')
    .select(`${CATALOG_SELECT}, ${PARTICIPATION_SELECT}`)
    .eq('event_participations.user_id', userId)
    .order('date', { ascending: true })
}

// ── Query with left-join for all participations (no user filter) ──────────────
// Safe for public/single-user use because participations are publicly readable
// and there is only one user in this app.
function baseQueryWithAllParticipations() {
  return supabase
    .from('events')
    .select(`${CATALOG_SELECT}, ${PARTICIPATION_SELECT}`)
    .order('date', { ascending: true })
}

// ── Query with inner-join: only events where this user has a participation ────
function baseQueryMyEvents(userId) {
  return supabase
    .from('events')
    .select(`${CATALOG_SELECT}, ${PARTICIPATION_INNER_SELECT}`)
    .eq('event_participations.user_id', userId)
    .order('date', { ascending: true })
}

// ── useEvents — all catalog events, always with participation data ─────────────
// Pass userId to filter participations to that user (multi-user safe).
// Omit userId for public/single-user use — returns all participations (safe
// because this is a single-user app and participations are publicly readable).
export function useEvents(userId = null) {
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadAllEvents() {
    loading.value = true
    error.value = null
    const query = userId ? baseQueryWithParticipation(userId) : baseQueryWithAllParticipations()
    const { data, error: err } = await query
    loading.value = false
    if (err) { error.value = err.message; return }
    events.value = data.map(flattenParticipation)
  }

  return { events, loading, error, loadAllEvents }
}

// ── useMyEvents — only events where the current user has a participation ───────
// Used by Dashboard.
export function useMyEvents(userId) {
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadAllEvents() {
    if (!userId) { events.value = []; return }
    loading.value = true
    error.value = null
    const { data, error: err } = await baseQueryMyEvents(userId)
    loading.value = false
    if (err) { error.value = err.message; return }
    events.value = data.map(flattenParticipation)
  }

  return { events, loading, error, loadAllEvents }
}

// ── useEvent — single event by id, optionally with user's participation ────────
export function useEvent() {
  const event = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function loadEvent(id, userId = null) {
    loading.value = true
    error.value = null
    const query = userId
      ? supabase
          .from('events')
          .select(`${CATALOG_SELECT}, ${PARTICIPATION_SELECT}`)
          .eq('event_participations.user_id', userId)
          .eq('id', id)
          .single()
      : supabase
          .from('events')
          .select(CATALOG_SELECT)
          .eq('id', id)
          .single()
    const { data, error: err } = await query
    loading.value = false
    if (err) { error.value = err.message; return }
    event.value = userId ? flattenParticipation(data) : data
  }

  return { event, loading, error, loadEvent }
}

// ── saveCatalogEvent ──────────────────────────────────────────────────────────
// Creates or updates the catalog (events table) entry.
// On create: also auto-inserts a participation with status='interested'.
// Returns the event id (new or existing).
export async function saveCatalogEvent(form, id = null) {
  const { data: { user } } = await supabase.auth.getUser()

  const row = {
    name:                 form.name,
    date:                 form.date,
    location:             form.location             || null,
    province_id:          Number(form.province_id),
    distance_category:    form.distance_category,
    event_url:            form.event_url            || null,
    registration_opens:   form.registration_opens   || null,
    registration_deadline:form.registration_deadline|| null,
    updated_at:           new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase.from('events').update(row).eq('id', id)
    if (error) throw error
    return id
  } else {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...row, created_by: user.id })
      .select('id')
      .single()
    if (error) throw error

    // Auto-create participation as 'interested'
    const { error: pErr } = await supabase.from('event_participations').insert({
      event_id: data.id,
      user_id:  user.id,
      status:   'interested',
    })
    if (pErr) throw pErr

    return data.id
  }
}

// ── saveParticipation ─────────────────────────────────────────────────────────
// Upserts the current user's participation record for a given event.
export async function saveParticipation(form, eventId) {
  const { data: { user } } = await supabase.auth.getUser()

  const row = {
    event_id:           eventId,
    user_id:            user.id,
    status:             form.status,
    finish_time:        form.finish_time        || null,
    timing_url:         form.timing_url         || null,
    actual_distance_km: form.actual_distance_km ? Number(form.actual_distance_km) : null,
    notes:              form.notes              || null,
  }

  const { error } = await supabase
    .from('event_participations')
    .upsert(row, { onConflict: 'event_id,user_id' })
  if (error) throw error
}

// ── saveEvent — facade used by VoltooiingModal (updates participation only) ───
export async function saveEvent(form, eventId) {
  await saveParticipation(form, eventId)
}

// ── joinEvent — create a participation with status='interested' ───────────────
// Uses upsert to be idempotent (safe against double-clicks/race conditions).
export async function joinEvent(eventId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('event_participations').upsert({
    event_id: eventId,
    user_id:  user.id,
    status:   'interested',
  }, { onConflict: 'event_id,user_id', ignoreDuplicates: true })
  if (error) throw error
}

// ── leaveEvent — remove the current user's participation ─────────────────────
export async function leaveEvent(eventId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('event_participations')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)
  if (error) throw error
}

// ── deleteEvent — remove catalog event (creator/admin only; cascades) ─────────
export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
