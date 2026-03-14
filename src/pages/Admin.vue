<template>
  <div>
    <div class="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
      <router-link to="/admin" class="text-sm hover:text-orange-600 transition-colors">{{ $t('admin.overview') }}</router-link>
      <router-link to="/admin/evenement/nieuw" class="text-sm hover:text-orange-600 transition-colors">{{ $t('admin.new_event') }}</router-link>
      <router-link to="/admin/strava" class="text-sm hover:text-orange-600 transition-colors">{{ $t('admin.strava') }}</router-link>
    </div>
    <router-view />
  </div>
</template>
