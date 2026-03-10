import { watch } from 'vue'
import { useAuthStore } from '../stores/auth.js'

export const routes = [
  {
    path: '/',
    component: () => import('../pages/Dashboard.vue'),
  },
  {
    path: '/evenementen',
    component: () => import('../pages/Evenementen.vue'),
  },
  {
    path: '/evenementen/:id',
    component: () => import('../pages/EvenementDetail.vue'),
  },
  {
    path: '/admin',
    component: () => import('../pages/Admin.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('../pages/admin/AdminOverzicht.vue'),
      },
      {
        path: 'evenement/nieuw',
        component: () => import('../pages/admin/EvenementFormulier.vue'),
      },
      {
        path: 'evenement/:id',
        component: () => import('../pages/admin/EvenementFormulier.vue'),
      },
      {
        path: 'strava',
        component: () => import('../pages/admin/StravaKoppeling.vue'),
      },
    ],
  },
  {
    path: '/inloggen',
    component: () => import('../pages/Inloggen.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    component: {
      template: `
        <div>
          <h1 class="text-2xl font-semibold mb-2">Pagina niet gevonden</h1>
          <p class="text-gray-500 text-sm mb-4">De pagina die je zoekt bestaat niet.</p>
          <router-link to="/" class="text-sm text-orange-600 hover:underline">← Terug naar overzicht</router-link>
        </div>
      `,
    },
  },
]

// Navigation guard — set up after router is created in main.js
export function setupAuthGuard(router) {
  router.beforeEach(async (to) => {
    if (!to.meta.requiresAuth) return
    const auth = useAuthStore()
    // Wait for Supabase session check to complete before evaluating auth state
    if (auth.loading) {
      await new Promise(resolve => {
        const stop = watch(() => auth.loading, (loading) => {
          if (!loading) { stop(); resolve() }
        })
      })
    }
    if (!auth.user) return '/inloggen'
  })
}
