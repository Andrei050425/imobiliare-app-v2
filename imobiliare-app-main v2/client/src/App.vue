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
        successColorSuppl: '#10b981',
        warningColor: '#f59e0b',
        warningColorHover: '#fbbf24',
        warningColorPressed: '#d97706',
        warningColorSuppl: '#f59e0b',
        errorColor: '#ef4444',
        errorColorHover: '#f87171',
        errorColorPressed: '#dc2626',
        errorColorSuppl: '#ef4444',
        infoColor: '#3b82f6',
        infoColorHover: '#60a5fa',
        infoColorPressed: '#2563eb',
        infoColorSuppl: '#3b82f6',
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

/* =========================================================
   STILURI PREMIUM GLOBALE SANTA (DESIGN SHOWCASE 2.0)
========================================================= */

/* Bare de filtrare compacte pe un singur rând (Inline Filters) */
.neo-inline-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  background: rgba(20, 27, 45, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 10px 16px;
}
.neo-inline-filters .spacer {
  flex: 1;
}

/* Status Chips rotunjite tip pastilă */
.status-chip {
  padding: 5px 12px;
  border-radius: 99px;
  font-size: 0.76rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.03em;
}
.status-chip.active { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.status-chip.info { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }
.status-chip.pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
.status-chip.danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

/* Categorie / Cod / Rol Pills */
.cat-pill {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}
.code-pill {
  font-family: monospace;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.84rem;
}
.role-badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
}
.role-admin { background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.4); }
.role-client { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); }
.role-user { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); }

/* Butoane de acțiuni pe rând */
.icon-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover { background: rgba(255, 255, 255, 0.12); color: white; transform: translateY(-1px); }
.icon-btn.danger:hover { background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }
.icon-btn.success:hover { background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.3); }

/* KPI Box */
.kpi-box {
  background: #141b2d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 22px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
}
.kpi-box:hover {
  transform: translateY(-3px);
}
.kpi-box.glow-indigo { box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.35); }
.kpi-box.glow-emerald { box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.35); }
.kpi-box.glow-amber { box-shadow: 0 10px 30px -10px rgba(245, 158, 11, 0.35); }
.kpi-box.glow-rose { box-shadow: 0 10px 30px -10px rgba(244, 63, 94, 0.35); }

/* =========================================================
   SHOWCASE NEOMORPHIC TABLES & PROFILE CARDS
========================================================= */

.neo-table-card {
  background: #141b2d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  overflow-x: auto;
}
.neo-table {
  width: 100%;
  border-collapse: collapse;
}
.neo-table th {
  text-align: left;
  padding: 14px;
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.neo-table td {
  padding: 16px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}
.neo-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* TENANTS CARDS */
.tenant-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
.tenant-profile-card {
  background: #141b2d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 22px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.tenant-profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -6px rgba(99, 102, 241, 0.25);
  border-color: rgba(99, 102, 241, 0.4);
}
.tenant-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.tenant-avatar {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}
.tenant-info h3 {
  margin: 0;
  font-size: 1.05rem;
  color: white;
}
.cui-tag {
  font-size: 0.8rem;
  color: #94a3b8;
}
.active-badge {
  margin-left: auto;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
}
.tenant-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.88rem;
  color: #cbd5e1;
  margin-bottom: 20px;
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-row i { color: #818cf8; font-size: 18px; }

/* OFFERS CARDS LIST */
.offers-cards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.offer-row-card {
  background: #141b2d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, border-color 0.2s;
}
.offer-row-card:hover {
  border-color: rgba(99, 102, 241, 0.4);
}
.offer-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.offer-left h3 {
  margin: 0;
  font-size: 1.1rem;
  color: white;
}
.offer-middle {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}
.financial-pill {
  display: flex;
  flex-direction: column;
}
.financial-pill .label { font-size: 0.78rem; color: #94a3b8; }
.financial-pill .val { font-size: 1.05rem; font-weight: 700; color: white; }
.text-green { color: #34d399; }

.offer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-accept {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.btn-reject {
  background: rgba(244, 63, 94, 0.15);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.sub-text {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 2px;
}

.progress-mini {
  width: 100px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 6px;
}
.progress-mini .fill {
  height: 100%;
  background: #6366f1;
}
</style>
