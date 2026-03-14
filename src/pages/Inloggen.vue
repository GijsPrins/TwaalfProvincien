<template>
  <div class="max-w-sm mx-auto mt-16">
    <h1 class="text-xl font-semibold mb-6">{{ $t('login.title') }}</h1>
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="login-email" class="block text-sm font-medium mb-1">{{ $t('login.email') }}</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label for="login-password" class="block text-sm font-medium mb-1">{{ $t('login.password') }}</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <p v-if="error" role="alert" class="text-red-500 text-sm">{{ error }}</p>
      <button
        type="submit"
        :disabled="busy"
        class="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {{ busy ? $t('login.submitting') : $t('login.submit') }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const { t } = useI18n()
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const router = useRouter()
const auth = useAuthStore()

async function handleLogin() {
  error.value = ''
  busy.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/admin')
  } catch (e) {
    error.value = t('login.error')
  } finally {
    busy.value = false
  }
}
</script>
