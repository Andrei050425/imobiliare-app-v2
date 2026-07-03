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

/* Design minimalist și modern pentru listele dropdown din toată aplicația */
.va-select-option-list,
.va-select-dropdown__options-wrapper {
  padding: 6px !important;
  background: #ffffff !important;
  border-radius: 8px !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
  max-height: 280px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  box-sizing: border-box !important;
  width: auto !important;
  min-width: auto !important;
  max-width: none !important;
}

.va-select-option,
.va-select-option-list__option,
.va-select-dropdown__options-wrapper .va-select-option {
  --va-select-option-list-option-min-height: 48px !important;
  --va-select-option-list-option-height: auto !important;
  --va-select-option-list-option-max-height: none !important;
  min-height: 48px !important;
  height: auto !important;
  max-height: none !important;
  padding: 8px 12px !important;
  margin: 0 !important;
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-start !important;
  line-height: 1.3 !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  overflow: visible !important;
  transition: all 0.15s ease !important;
  cursor: pointer !important;
  box-sizing: border-box !important;
  width: 100% !important;
  color: #334155 !important;
  font-weight: 400 !important;
  font-size: 0.9rem !important;
}

/* Stare hover sau selectată */
.va-select-option:hover,
.va-select-option--highlighted,
.va-select-option-list__option:hover {
  background: #f8fafc !important;
  border-color: #94a3b8 !important;
  color: #0f172a !important;
  font-weight: 500 !important;
}

.va-select-option--selected,
.va-select-option-list__option--selected {
  background: #eff6ff !important;
  border-color: #3b82f6 !important;
  color: #2563eb !important;
  font-weight: 600 !important;
}

.va-select-option__content,
.va-select-option-list__option-content,
[class*="va-select-option__content"] {
  line-height: 1.3 !important;
  padding: 0 !important;
  margin: 0 !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  color: inherit !important;
  font-weight: inherit !important;
  font-size: inherit !important;
}

/* Styling minimalist pentru bara de căutare din interiorul listei dropdown */
.va-select-content__autocomplete,
.va-select-dropdown__content-search-input,
.va-select-option-list .va-input-wrapper {
  margin-bottom: 4px !important;
  padding: 2px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
.va-select-content__autocomplete input,
.va-select-dropdown__content-search-input input,
.va-select-option-list input {
  padding: 6px 10px !important;
  font-size: 0.85rem !important;
  border-radius: 4px !important;
  border: 1px solid #cbd5e1 !important;
  background: #f8fafc !important;
  color: #1e293b !important;
  width: 100% !important;
  box-sizing: border-box !important;
  outline: none !important;
}
.va-select-content__autocomplete input:focus,
.va-select-dropdown__content-search-input input:focus,
.va-select-option-list input:focus {
  border-color: #3b82f6 !important;
  background: #ffffff !important;
}
</style>
