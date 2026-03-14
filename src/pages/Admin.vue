<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const router = useRouter()

watch(() => auth.user, (user) => {
  if (!user) router.replace('/inloggen')
}, { immediate: true })
</script>

<template>
  <div>
    <div class="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
      <router-link to="/admin" class="text-sm hover:text-orange-600 transition-colors">{{ $t('admin.overview') }}</router-link>
      <router-link to="/admin/evenement/nieuw" class="text-sm hover:text-orange-600 transition-colors">{{ $t('admin.new_event') }}</router-link>
      <router-link to="/admin/strava" class="text-sm hover:text-orange-600 transition-colors">{{ $t('admin.strava') }}</router-link>
    </div>
    <router-view />
  </div>
</template>
