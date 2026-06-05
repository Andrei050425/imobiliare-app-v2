<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import PublicLayout from './layouts/PublicLayout.vue';
import AppLayout from './layouts/AppLayout.vue';

export default {
  name: 'App',
  components: { PublicLayout, AppLayout },
  setup() {
    const route = useRoute();
    const store = useStore();
    const layoutComponent = computed(() => {
      const isAuthRoute = ['Login', 'Register'].includes(route.name);
      if (store.getters.isLoggedIn && !isAuthRoute) {
        return 'AppLayout';
      }
      return route.meta.layout === 'app' ? 'AppLayout' : 'PublicLayout';
    });
    return { layoutComponent };
  }
};
</script>

<style>
:root { --santa-bg: #f4f5f7; }
body { margin: 0; background: var(--santa-bg); }
.page-title { font-size: 1.6rem; font-weight: 600; margin-bottom: 1.2rem; }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 1rem; }
.toolbar .spacer { flex: 1; }

/* Adăugare spațiere și dimensiuni atragătoare vizual pentru butoanele din tabele */
.va-data-table .va-button {
  min-width: 38px !important;
  min-height: 38px !important;
  font-size: 0.95rem !important;
}
.va-data-table .va-button .va-icon {
  font-size: 1.4rem !important;
}
.va-data-table .va-button + .va-button {
  margin-left: 0.85rem !important;
}
</style>
