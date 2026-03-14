import { createI18n } from 'vue-i18n'
import nl from '../locales/nl.json'
import en from '../locales/en.json'

const savedLocale = localStorage.getItem('locale')
const browserLocale = navigator.language?.startsWith('nl') ? 'nl' : 'en'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale || browserLocale,
  fallbackLocale: 'nl',
  messages: { nl, en },
})
