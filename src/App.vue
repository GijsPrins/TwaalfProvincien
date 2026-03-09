<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <router-link to="/" class="font-semibold text-lg tracking-tight">
          12 Provincies
        </router-link>
        <div class="flex items-center gap-6 text-sm">
          <router-link to="/" class="hover:text-orange-600 transition-colors">Overzicht</router-link>
          <router-link to="/evenementen" class="hover:text-orange-600 transition-colors">Evenementen</router-link>
          <template v-if="auth.user">
            <router-link to="/admin" class="hover:text-orange-600 transition-colors">Beheer</router-link>
            <button @click="auth.logout()" class="text-gray-400 hover:text-gray-700 transition-colors">
              Uitloggen
            </button>
          </template>
          <template v-else>
            <router-link to="/inloggen" class="hover:text-orange-600 transition-colors">Inloggen</router-link>
          </template>
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-4 py-8">
      <router-view v-if="!auth.loading" />
      <div v-else class="flex justify-center py-20 text-gray-400 text-sm">Laden…</div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'
import { setupAuthGuard } from './router/index.js'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  auth.init()
  setupAuthGuard(router)
})
</script>
