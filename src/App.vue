<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
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
            <button @click="auth.logout()" class="text-gray-400 hover:text-gray-700 transition-colors">
              {{ $t('nav.logout') }}
            </button>
          </template>
          <template v-else>
            <router-link to="/inloggen" class="hover:text-orange-600 transition-colors">{{ $t('nav.login') }}</router-link>
          </template>
          <button
            @click="toggleLocale"
            class="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium tabular-nums w-6 text-center"
          >
            {{ locale === 'nl' ? 'EN' : 'NL' }}
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-4 py-8">
      <router-view v-if="!auth.loading" />
      <div v-else class="flex justify-center py-20 text-gray-400 text-sm">{{ $t('common.loading') }}</div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from './stores/auth.js'
import { setupAuthGuard } from './router/index.js'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const { locale } = useI18n()

function toggleLocale() {
  locale.value = locale.value === 'nl' ? 'en' : 'nl'
  localStorage.setItem('locale', locale.value)
}

onMounted(() => {
  auth.init()
  setupAuthGuard(router)
})
</script>
