import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import { routes } from './router/index.js'
import { i18n } from './i18n/index.js'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

createApp(App).use(router).use(i18n).mount('#app')
