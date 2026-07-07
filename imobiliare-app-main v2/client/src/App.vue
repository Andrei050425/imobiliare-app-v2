<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <component :is="layoutComponent">
            <router-view />
          </component>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, darkTheme } from 'naive-ui';
import PublicLayout from './layouts/PublicLayout.vue';
import AppLayout from './layouts/AppLayout.vue';

export default {
  name: 'App',
  components: { PublicLayout, AppLayout, NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider },
  setup() {
    const route = useRoute();
    const store = useStore();

    const themeOverrides = {
      common: {
        primaryColor: '#6366f1',
        primaryColorHover: '#818cf8',
        primaryColorPressed: '#4f46e5',
        primaryColorSuppl: '#a5b4fc',
        successColor: '#10b981',
        successColorHover: '#34d399',
        successColorPressed: '#059669',
        warningColor: '#f59e0b',
        warningColorHover: '#fbbf24',
        warningColorPressed: '#d97706',
        errorColor: '#ef4444',
        errorColorHover: '#f87171',
        errorColorPressed: '#dc2626',
        infoColor: '#3b82f6',
        infoColorHover: '#60a5fa',
        infoColorPressed: '#2563eb',
        borderRadius: '8px',
        fontFamily: "'Outfit', 'Inter', sans-serif",
      },
    };

    const layoutComponent = computed(() => {
      const isAuthRoute = ['Login', 'Register'].includes(route.name);
      if (store.getters.isLoggedIn && !isAuthRoute) {
        return 'AppLayout';
      }
      return route.meta.layout === 'app' ? 'AppLayout' : 'PublicLayout';
    });
    return { layoutComponent, darkTheme, themeOverrides };
  }
};
</script>

<style>
:root { --santa-bg: #18181c; }
body { margin: 0; background: var(--santa-bg); color: #e2e8f0; font-family: 'Outfit', 'Inter', sans-serif; }
.page-title { font-size: 1.6rem; font-weight: 600; margin-bottom: 1.2rem; color: #f1f5f9; }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 1rem; }
.toolbar .spacer { flex: 1; }

/* Fix pentru autofill-ul din browser în dark mode (elimină fundalul alb/albastru la input-uri în Login/Register) */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
select:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px #26262a inset !important;
  -webkit-text-fill-color: #e2e8f0 !important;
  caret-color: #e2e8f0 !important;
  transition: background-color 5000s ease-in-out 0s !important;
}
</style>
