import { DISTANCES } from '../data/provinces.js'

export const UPCOMING_STATUSES = ['interested', 'signed_up']
export const FINISHED_STATUSES = ['completed', 'dnf']

export function distanceLabel(value) {
  return DISTANCES.find(d => d.value === value)?.label ?? value
}

export function formatDate(date, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Date(date).toLocaleDateString('nl-NL', options)
}
