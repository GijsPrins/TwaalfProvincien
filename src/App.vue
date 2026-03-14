<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-orange-600 focus:top-2 focus:left-2 focus:rounded">
      {{ $t('nav.skip_to_content') }}
    </a>
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <router-link to="/" class="font-semibold text-lg tracking-tight">
          {{ $t('nav.title') }}
        </router-link>
        <div class="flex items-center gap-6 text-sm">
          <router-link to="/" class="hover:text-orange-600 transition-colors">{{ $t('nav.overview') }}</router-link>
          <router-link to="/evenementen" class="hover:text-orange-600 transition-colors">{{ $t('nav.events') }}</router-link>
          <template v-if="auth.user">
            <router-link to="/admin" class="hover:text-orange-600 transition-colors">{{ $t('nav.admin') }}</router-link>
            <button @click="auth.logout()" class="text-gray-500 hover:text-gray-700 transition-colors">
              {{ $t('nav.logout') }}
            </button>
          </template>
          <template v-else>
            <router-link to="/inloggen" class="hover:text-orange-600 transition-colors">{{ $t('nav.login') }}</router-link>
          </template>
          <button
            @click="toggleLocale"
            :aria-label="$t('nav.switch_locale')"
            class="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium tabular-nums w-6 text-center"
          >
            {{ locale === 'nl' ? 'EN' : 'NL' }}
          </button>
        </div>
      </div>
    </nav>

    <main id="main-content" class="max-w-5xl mx-auto px-4 py-8">
      <router-view v-if="!auth.loading" />
      <div v-else role="status" aria-live="polite" class="flex justify-center py-20 text-gray-500 text-sm">{{ $t('common.loading') }}</div>
    </main>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useAuthStore } from './stores/auth.js'

const auth = useAuthStore()
const { locale } = useI18n()

function toggleLocale() {
  locale.value = locale.value === 'nl' ? 'en' : 'nl'
  localStorage.setItem('locale', locale.value)
}
</script>
