<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import PublicLayout from './layouts/PublicLayout.vue';
import AppLayout from './layouts/AppLayout.vue';

export default {
  name: 'App',
  components: { PublicLayout, AppLayout },
  setup() {
    const route = useRoute();
    const layoutComponent = computed(() =>
      route.meta.layout === 'app' ? 'AppLayout' : 'PublicLayout'
    );
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
</style>
