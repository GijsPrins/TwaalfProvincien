<template>
  <div>
    <h2 class="text-lg font-semibold mb-4">{{ $t('admin_overview.title') }}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <router-link
        to="/admin/evenement/nieuw"
        class="block p-4 border border-gray-200 rounded-xl hover:border-orange-300 transition-colors"
      >
        <div class="font-medium mb-1">{{ $t('admin_overview.add_event_title') }}</div>
        <div class="text-sm text-gray-500">{{ $t('admin_overview.add_event_desc') }}</div>
      </router-link>
      <router-link
        to="/admin/strava"
        class="block p-4 border border-gray-200 rounded-xl hover:border-orange-300 transition-colors"
      >
        <div class="font-medium mb-1">{{ $t('admin_overview.strava_title') }}</div>
        <div class="text-sm text-gray-500">{{ $t('admin_overview.strava_desc') }}</div>
      </router-link>
    </div>
  </div>
</template>
