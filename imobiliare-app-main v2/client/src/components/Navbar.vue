<template>
  <header class="navbar-bar">
    <div class="navbar-left">
      <span class="logo">Imobiliare</span>
    </div>
    <div class="navbar-right">
      <router-link to="/" class="nav-link">Oferte</router-link>
      <template v-if="!isLoggedIn">
        <router-link to="/login" class="nav-link">Login</router-link>
        <router-link to="/register" class="nav-link">Register</router-link>
      </template>
      <template v-else>
        <router-link to="/add" class="nav-link">Adaugă Anunț</router-link>
        <router-link v-if="isAdmin" to="/admin" class="nav-link" style="color: #FFD700;">
          <n-icon size="16"><i class="material-icons">admin_panel_settings</i></n-icon> Admin
        </router-link>
        <span class="user-name">Salut, {{ user?.name }}</span>
        <n-button type="error" size="small" @click="handleLogout">Logout</n-button>
      </template>
    </div>
  </header>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { NButton, NIcon } from 'naive-ui';

export default {
  name: 'Navbar',
  components: { NButton, NIcon },
  setup() {
    const store = useStore();
    const router = useRouter();

    const isLoggedIn = computed(() => store.getters.isLoggedIn);
    const user = computed(() => store.getters.currentUser);
    const isAdmin = computed(() => store.getters.isAdmin);

    const handleLogout = () => {
      store.dispatch('logout');
      router.push('/login');
    };

    return { isLoggedIn, user, isAdmin, handleLogout };
  }
}
</script>

<style scoped>
.navbar-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  background: linear-gradient(135deg, #312e81, #4338ca);
  margin-bottom: 12px;
}
.navbar-left { display: flex; align-items: center; }
.navbar-right { display: flex; align-items: center; gap: 12px; }
.nav-link { color: white; text-decoration: none; font-weight: bold; }
.logo { font-weight: bold; font-size: 1.2rem; color: white; }
.user-name { color: white; margin-right: 10px; }
</style>