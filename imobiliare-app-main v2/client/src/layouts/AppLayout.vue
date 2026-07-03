<template>
  <div class="app-shell">
    <va-navbar color="primary" class="app-navbar">
      <template #left>
        <va-navbar-item class="brand d-flex align-center">
          <button 
            class="hamburger-btn mr-3" 
            :class="{ 'is-active': isOpen, 'is-pinned': isPinned }"
            @click="togglePin"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
            title="Meniu navigare (Hover pentru deschidere / Click pentru fixare)"
          >
            <va-icon :name="isPinned ? 'menu_open' : 'menu'" />
          </button>
          <va-icon name="apartment" class="mr-2" /> 
          <span>SANTA</span>
        </va-navbar-item>
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
      <!-- Placeholder pentru spațiul din layout când meniul este fixat (pinned) -->
      <div class="sidebar-placeholder" :class="{ 'is-pinned': isPinned }"></div>

      <!-- Sidebar-ul retractabil / interactiv -->
      <aside 
        class="app-sidebar" 
        :class="{ 
          'is-open': isOpen, 
          'is-pinned': isPinned,
          'is-floating': !isPinned && isOpen 
        }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div class="sidebar-links">
          <router-link
            v-for="item in menu"
            :key="item.to"
            :to="item.to"
            class="side-link"
            :class="{ active: $route.path === item.to }"
            @click="handleLinkClick"
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
import { ref, computed } from 'vue';
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

    // --- Stare Sidebar Interactiv ---
    const isPinned = ref(false); // Implicit închis (doar butonul cu 3 linii este vizibil)
    const isHovered = ref(false);
    let hoverTimer = null;

    const isOpen = computed(() => isPinned.value || isHovered.value);

    const handleMouseEnter = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      isHovered.value = true;
    };

    const handleMouseLeave = () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        isHovered.value = false;
      }, 300); // 300ms delay pentru o trecere fluidă mouse între buton și meniu
    };

    const togglePin = () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      isPinned.value = !isPinned.value;
      if (!isPinned.value) {
        isHovered.value = false;
      }
    };

    const handleLinkClick = () => {
      if (!isPinned.value) {
        isHovered.value = false;
      }
    };

    return { 
      menu, roleLabel, user, handleLogout, showSupport,
      isPinned, isHovered, isOpen, handleMouseEnter, handleMouseLeave, togglePin, handleLinkClick
    };
  }
};
</script>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100vh; }
.app-navbar { z-index: 1001; position: relative; }
.brand { color: #fff; font-weight: 700; font-size: 1.2rem; display: flex; align-items: center; }
.user-name { color: #fff; margin-right: 10px; }

/* Butonul cu 3 linii (Hamburger) */
.hamburger-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  outline: none;
}
.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}
.hamburger-btn.is-pinned {
  background: rgba(255, 255, 255, 0.35);
  border-color: #ffffff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

/* Layout Corp Aplicație */
.app-body { display: flex; flex: 1; overflow: hidden; position: relative; }

/* Placeholder pentru când meniul este fixat (pinned) */
.sidebar-placeholder {
  width: 0px;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-placeholder.is-pinned {
  width: 240px;
}

/* Sidebar Interactiv / Retractabil */
.app-sidebar { 
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 240px; 
  background: #fff; 
  border-right: 1px solid #e5e7eb; 
  display: flex; 
  flex-direction: column; 
  overflow-y: auto; 
  overflow-x: hidden;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  pointer-events: none;
  white-space: nowrap;
}
.app-sidebar.is-open {
  transform: translateX(0);
  pointer-events: auto;
}
.app-sidebar.is-floating {
  box-shadow: 6px 0 25px rgba(0, 0, 0, 0.15);
  border-right-color: transparent;
}
.app-sidebar.is-pinned {
  box-shadow: none;
  border-right: 1px solid #e5e7eb;
}

.sidebar-links { flex: 1; padding: 12px 0; }
.sidebar-footer { padding: 16px; border-top: 1px solid #e5e7eb; }
.side-link { display: flex; align-items: center; padding: 12px 20px; color: #374151; text-decoration: none; font-size: 0.95rem; transition: background 0.15s ease; }
.side-link:hover { background: #f3f4f6; }
.side-link.active { background: #ede9fe; color: var(--va-primary); border-right: 3px solid var(--va-primary); font-weight: 600; }
.app-main { flex: 1; padding: 24px; overflow-y: auto; background: #f4f5f7; min-width: 0; }
.w-full { width: 100%; }
.justify-start { justify-content: flex-start; }
</style>
