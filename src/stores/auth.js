import { reactive, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

export function useAuthStore() {
  return authStore
}

async function loadProfile(userId) {
  if (!userId) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
  return data ?? null
}

const authStore = reactive({
  user: null,
  profile: null,
  loading: true,

  get isAdmin() {
    return authStore.profile?.is_admin ?? false
  },

  async init() {
    const { data } = await supabase.auth.getSession()
    authStore.user = data.session?.user ?? null
    authStore.profile = await loadProfile(authStore.user?.id)
    authStore.loading = false

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const prevId = authStore.user?.id
      authStore.user = session?.user ?? null
      if (authStore.user?.id !== prevId) {
        authStore.profile = await loadProfile(authStore.user?.id)
      }
    })
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    authStore.user = data.user
    authStore.profile = await loadProfile(data.user?.id)
  },

  async logout() {
    await supabase.auth.signOut()
    authStore.user = null
    authStore.profile = null
  },
})
