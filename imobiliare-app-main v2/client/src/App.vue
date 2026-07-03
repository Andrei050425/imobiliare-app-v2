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

/* Styling pentru listele dropdown din va-select - Căsuțe mari, spațioase, ordonate și elastice */
.va-select-option-list,
.va-select-dropdown__options-wrapper,
.va-dropdown__content {
  padding: 12px !important;
  background: #f8fafc !important;
  border-radius: 12px !important;
  min-width: 480px !important;
  width: auto !important;
  max-width: 90vw !important;
  max-height: 420px !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 10px !important;
  box-sizing: border-box !important;
}

.va-select-option,
.va-select-option-list__option,
.va-select-dropdown__options-wrapper .va-select-option {
  --va-select-option-list-option-min-height: 76px !important;
  --va-select-option-list-option-height: auto !important;
  --va-select-option-list-option-max-height: none !important;
  --va-select-option-list-option-display: block !important;
  min-height: 76px !important;
  height: auto !important;
  max-height: none !important;
  padding: 16px 20px !important;
  margin: 0 !important;
  background: #ffffff !important;
  border: 1.5px solid #cbd5e1 !important;
  border-radius: 10px !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05) !important;
  display: block !important;
  line-height: 1.6 !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  overflow: visible !important;
  transition: all 0.2s ease-in-out !important;
  cursor: pointer !important;
  box-sizing: border-box !important;
  width: 100% !important;
}

/* Stare hover, activă sau selectată pentru căsuța opțiunii */
.va-select-option:hover,
.va-select-option--highlighted,
.va-select-option-list__option:hover,
.va-select-option--selected,
.va-select-option-list__option--selected {
  background: #eff6ff !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15) !important;
  transform: translateY(-1px) !important;
}

.va-select-option__content,
.va-select-option-list__option-content,
[class*="va-select-option__content"] {
  line-height: 1.6 !important;
  padding: 0 !important;
  margin: 0 !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  display: block !important;
  width: 100% !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  color: #1e293b !important;
  font-weight: 500 !important;
  font-size: 0.95rem !important;
}
</style>
