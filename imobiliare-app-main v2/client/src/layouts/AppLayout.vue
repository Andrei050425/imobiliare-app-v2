<template>
  <div class="app-shell">
    <header class="app-navbar">
      <div class="navbar-left">
        <button 
          class="hamburger-btn" 
          :class="{ 'is-active': isOpen, 'is-pinned': isPinned }"
          @click="togglePin"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
          title="Meniu navigare (Hover pentru deschidere / Click pentru fixare)"
        >
          <n-icon size="20"><i class="material-icons">{{ isPinned ? 'menu_open' : 'menu' }}</i></n-icon>
        </button>
        <n-icon size="20" class="brand-icon"><i class="material-icons">apartment</i></n-icon>
        <span class="brand-text">SANTA</span>
      </div>
      <div class="navbar-right">
        <n-tag size="small" :bordered="true" round>{{ roleLabel }}</n-tag>
        <span class="user-name">{{ user?.name }}</span>
        <n-button quaternary size="small" @click="handleLogout">
          <template #icon><n-icon><i class="material-icons">logout</i></n-icon></template>
          Ieșire
        </n-button>
      </div>
    </header>

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
            <n-icon size="18"><i class="material-icons">{{ item.icon }}</i></n-icon>
            <span class="link-title-wrap" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span>{{ item.title }}</span>
              <n-badge v-if="item.badgeCount > 0" :value="item.badgeCount" :max="99" :type="item.badgeType" style="margin-left: auto;" />
            </span>
          </router-link>
        </div>
        <div class="sidebar-footer">
          <n-button text type="info" @click="showSupport" class="support-btn">
            <template #icon><n-icon><i class="material-icons">support_agent</i></n-icon></template>
            Contactați suportul tehnic
          </n-button>
        </div>
      </aside>

      <main class="app-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useMessage, NButton, NIcon, NTag, NBadge } from 'naive-ui';
import api from '../services/api';

const MENUS = {
  admin: [
    { title: 'Acasă', icon: 'home', to: '/app/dashboard' },
    { title: 'Catalog', icon: 'search', to: '/' },
    { title: 'Spații', icon: 'store', to: '/app/properties' },
    { title: 'Chiriași', icon: 'groups', to: '/app/tenants' },
    { title: 'Contracte', icon: 'description', to: '/app/contracts' },
    { title: 'Facturi', icon: 'receipt_long', to: '/app/invoices' },
    { title: 'Utilizatori', icon: 'manage_accounts', to: '/app/users' },
    { title: 'Oferte', icon: 'local_offer', to: '/app/offers' },
  ],

  client: [
    { title: 'Acasă', icon: 'home', to: '/app/dashboard' },
    { title: 'Catalog', icon: 'search', to: '/' },
    { title: 'Contractele mele', icon: 'description', to: '/app/my-contracts' },
    { title: 'Facturile mele', icon: 'receipt_long', to: '/app/my-invoices' },
    { title: 'Ofertele mele', icon: 'local_offer', to: '/app/my-offers' },
  ],
  user: [
    { title: 'Catalog', icon: 'search', to: '/' },
    { title: 'Ofertele mele', icon: 'local_offer', to: '/app/my-offers' },
  ],
};
const ROLE_LABELS = { admin: 'Administrator', client: 'Chiriaș', user: 'Utilizator' };

export default {
  name: 'AppLayout',
  components: { NButton, NIcon, NTag, NBadge },
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const message = useMessage();
    
    const role = computed(() => store.getters.userRole);
    const badges = ref({ offers: false, contracts: false, invoices: false });
    let badgeInterval = null;

    const loadBadges = async () => {
      if (!store.getters.isLoggedIn) return;
      try {
        const res = await api.get('/dashboard/badges');
        badges.value = res.data;
      } catch (e) {
        console.error('Eroare la încărcarea notificărilor (buline):', e);
      }
    };

    onMounted(() => {
      loadBadges();
      badgeInterval = setInterval(loadBadges, 15000);
    });

    onUnmounted(() => {
      if (badgeInterval) clearInterval(badgeInterval);
    });

    watch(() => route.path, () => {
      loadBadges();
    });

    const menu = computed(() => {
      const baseMenu = MENUS[role.value] || [];
      return baseMenu.map(item => {
        let badge = false;
        let badgeColor = '';
        let badgeCount = 0;
        let badgeType = 'info';
        if (item.to === '/app/offers' || item.to === '/app/my-offers') {
          badge = badges.value.offers;
          badgeColor = 'dot-info';
          badgeCount = badges.value.offersCount || 0;
          badgeType = 'info';
        } else if (item.to === '/app/contracts' || item.to === '/app/my-contracts') {
          badge = badges.value.contracts;
          badgeColor = 'dot-warning';
          badgeCount = badges.value.draftContractsCount || 0;
          badgeType = 'warning';
        } else if (item.to === '/app/invoices' || item.to === '/app/my-invoices') {
          badge = badges.value.invoices;
          badgeColor = 'dot-danger';
          badgeCount = badges.value.overdueInvoicesCount || 0;
          badgeType = 'error';
        }
        return { ...item, badge, badgeColor, badgeCount, badgeType };
      });
    });

    const roleLabel = computed(() => ROLE_LABELS[role.value] || '');
    const user = computed(() => store.getters.currentUser);
    const handleLogout = () => { store.dispatch('logout'); router.push('/login'); };
    const showSupport = () => { 
      message.warning('📞 Sunați la numărul 7011224434 pentru asistență.');
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
.app-navbar { 
  z-index: 1001; 
  position: relative; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  background: linear-gradient(135deg, #312e81, #4338ca);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
.navbar-left { display: flex; align-items: center; gap: 10px; }
.navbar-right { display: flex; align-items: center; gap: 12px; }
.brand-icon { color: rgba(255, 255, 255, 0.9); }
.brand-text { color: #fff; font-weight: 700; font-size: 1.2rem; }
.user-name { color: rgba(255, 255, 255, 0.85); margin-right: 4px; font-size: 0.9rem; }

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
  background: #1e1e2e; 
  border-right: 1px solid rgba(255, 255, 255, 0.08); 
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
  box-shadow: 6px 0 25px rgba(0, 0, 0, 0.4);
  border-right-color: transparent;
}
.app-sidebar.is-pinned {
  box-shadow: none;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-links { flex: 1; padding: 12px 0; }
.sidebar-footer { padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08); }
.support-btn { width: 100%; justify-content: flex-start; }
.side-link { display: flex; align-items: center; gap: 10px; padding: 12px 20px; color: rgba(255, 255, 255, 0.65); text-decoration: none; font-size: 0.95rem; transition: all 0.15s ease; }
.side-link:hover { background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.9); }
.side-link.active { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border-right: 3px solid #6366f1; font-weight: 600; }
.app-main { flex: 1; padding: 24px; overflow-y: auto; background: #18181c; min-width: 0; }

/* Buline de notificare (meniu lateral) */
.link-title-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.notification-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  position: absolute;
  top: -2px;
  right: -13px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.25);
  animation: pulse-dot 2s infinite;
}
.dot-info {
  background-color: #3b82f6;
  box-shadow: 0 0 6px #3b82f6;
}
.dot-warning {
  background-color: #ffc107;
  box-shadow: 0 0 6px #ffc107;
}
.dot-danger {
  background-color: #e53935;
  box-shadow: 0 0 6px #e53935;
}
@keyframes pulse-dot {
  0% { transform: scale(0.95); opacity: 0.85; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.85; }
}
</style>
