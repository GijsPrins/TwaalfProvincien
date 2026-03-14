import { i18n } from '../i18n/index.js'

export const UPCOMING_STATUSES = ['interested', 'signed_up']
export const FINISHED_STATUSES = ['completed', 'dnf']

export function distanceLabel(value) {
  return i18n.global.t(`distances.${value}.label`)
}

export function formatDate(date, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const localeMap = { nl: 'nl-NL', en: 'en-GB' }
  const jsLocale = localeMap[i18n.global.locale.value] ?? 'nl-NL'
  return new Date(date).toLocaleDateString(jsLocale, options)
}
