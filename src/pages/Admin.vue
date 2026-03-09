<template>
  <div>
    <div class="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
      <router-link to="/admin" class="text-sm hover:text-orange-600 transition-colors">Overzicht</router-link>
      <router-link to="/admin/evenement/nieuw" class="text-sm hover:text-orange-600 transition-colors">Nieuw evenement</router-link>
      <router-link to="/admin/strava" class="text-sm hover:text-orange-600 transition-colors">Strava</router-link>
    </div>
    <router-view />
  </div>
</template>
