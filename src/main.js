import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import { routes, setupAuthGuard } from './router/index.js'
import { i18n } from './i18n/index.js'
import { useAuthStore } from './stores/auth.js'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

setupAuthGuard(router)

;(async () => {
  const auth = useAuthStore()
  await auth.init()
  createApp(App).use(router).use(i18n).mount('#app')
})()
