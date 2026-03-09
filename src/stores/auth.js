import { reactive } from 'vue'
import { supabase } from '../lib/supabase.js'

export function useAuthStore() {
  return authStore
}

const authStore = reactive({
  user: null,
  loading: true,

  async init() {
    const { data } = await supabase.auth.getSession()
    authStore.user = data.session?.user ?? null
    authStore.loading = false

    supabase.auth.onAuthStateChange((_event, session) => {
      authStore.user = session?.user ?? null
    })
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    authStore.user = data.user
  },

  async logout() {
    await supabase.auth.signOut()
    authStore.user = null
  },
})
