<template>
  <div class="app-shell">
    <va-navbar color="primary" class="app-navbar">
      <template #left>
        <va-navbar-item class="brand"><va-icon name="apartment" class="mr-2" /> SANTA</va-navbar-item>
      </template>
      <template #right>
        <va-navbar-item><va-chip size="small" outline color="#ffffff" class="mr-3">{{ roleLabel }}</va-chip></va-navbar-item>
        <va-navbar-item class="user-name">{{ user?.name }}</va-navbar-item>
        <va-navbar-item>
          <va-button preset="secondary" color="#ffffff" icon="logout" @click="handleLogout">Ieșire</va-button>
        </va-navbar-item>
      </template>
    </va-navbar>

    <div class="app-body">
      <aside class="app-sidebar">
        <div class="sidebar-links">
          <router-link
            v-for="item in menu"
            :key="item.to"
            :to="item.to"
            class="side-link"
            :class="{ active: $route.path === item.to }"
          >
            <va-icon :name="item.icon" class="mr-2" />
            <span>{{ item.title }}</span>
          </router-link>
        </div>
        <div class="sidebar-footer">
          <va-button preset="plain" color="info" icon="support_agent" @click="showSupport" class="w-full justify-start">
            Contactați suportul tehnic
          </va-button>
        </div>
      </aside>

      <main class="app-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from 'vuestic-ui';

const MENUS = {
  admin: [
    { title: 'Acasă', icon: 'home', to: '/app/dashboard' },
    { title: 'Catalog', icon: 'search', to: '/' },
    { title: 'Spații', icon: 'store', to: '/app/properties' },
    { title: 'Chiriași', icon: 'groups', to: '/app/tenants' },
    { title: 'Contracte', icon: 'description', to: '/app/contracts' },
    { title: 'Facturi', icon: 'receipt_long', to: '/app/invoices' },
    { title: 'Utilizatori', icon: 'manage_accounts', to: '/app/users' },
    { title: 'Cereri și Oferte', icon: 'local_offer', to: '/app/offers' },
  ],

  client: [
    { title: 'Acasă', icon: 'home', to: '/app/dashboard' },
    { title: 'Catalog', icon: 'search', to: '/' },
    { title: 'Contractele mele', icon: 'description', to: '/app/my-contracts' },
    { title: 'Facturile mele', icon: 'receipt_long', to: '/app/my-invoices' },
    { title: 'Ofertele mele', icon: 'local_offer', to: '/app/my-offers' },
  ],
  user: [
    { title: 'Acasă', icon: 'home', to: '/app/dashboard' },
    { title: 'Catalog', icon: 'search', to: '/' },
    { title: 'Ofertele mele', icon: 'local_offer', to: '/app/my-offers' },
  ],
};
const ROLE_LABELS = { admin: 'Administrator', client: 'Chiriaș', user: 'Utilizator' };

export default {
  name: 'AppLayout',
  setup() {
    const store = useStore();
    const router = useRouter();
    const { init } = useToast();
    
    const role = computed(() => store.getters.userRole);
    const menu = computed(() => MENUS[role.value] || []);
    const roleLabel = computed(() => ROLE_LABELS[role.value] || '');
    const user = computed(() => store.getters.currentUser);
    const handleLogout = () => { store.dispatch('logout'); router.push('/login'); };
    const showSupport = () => { 
      init({ 
        message: '📞 Sunați la numărul 7011224434 pentru asistență.', 
        color: 'warning' 
      }); 
    };
    return { menu, roleLabel, user, handleLogout, showSupport };
  }
};
</script>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100vh; }
.brand { color: #fff; font-weight: 700; font-size: 1.2rem; }
.user-name { color: #fff; margin-right: 10px; }
.app-body { display: flex; flex: 1; overflow: hidden; }
.app-sidebar { width: 240px; background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0; }
.sidebar-links { flex: 1; padding: 12px 0; }
.sidebar-footer { padding: 16px; border-top: 1px solid #e5e7eb; }
.side-link { display: flex; align-items: center; padding: 12px 20px; color: #374151; text-decoration: none; font-size: 0.95rem; }
.side-link:hover { background: #f3f4f6; }
.side-link.active { background: #ede9fe; color: var(--va-primary); border-right: 3px solid var(--va-primary); font-weight: 600; }
.app-main { flex: 1; padding: 24px; overflow-y: auto; background: #f4f5f7; }
.w-full { width: 100%; }
.justify-start { justify-content: flex-start; }
</style>
