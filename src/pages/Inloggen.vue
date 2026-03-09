<template>
  <div class="max-w-sm mx-auto mt-16">
    <h1 class="text-xl font-semibold mb-6">Inloggen</h1>
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">E-mailadres</label>
        <input
          v-model="email"
          type="email"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Wachtwoord</label>
        <input
          v-model="password"
          type="password"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <button
        type="submit"
        :disabled="busy"
        class="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {{ busy ? 'Inloggen…' : 'Inloggen' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

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
    error.value = 'Inloggen mislukt. Controleer je e-mailadres en wachtwoord.'
  } finally {
    busy.value = false
  }
}
</script>
