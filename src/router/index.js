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
]

// Navigation guard — set up after router is created in main.js
export function setupAuthGuard(router) {
  router.beforeEach((to) => {
    if (to.meta.requiresAuth) {
      const auth = useAuthStore()
      if (!auth.user) {
        return '/inloggen'
      }
    }
  })
}
