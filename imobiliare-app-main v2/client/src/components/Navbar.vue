<template>
  <va-navbar color="primary" class="mb-3">
    <template #left>
      <va-navbar-item class="logo">Imobiliare</va-navbar-item>
    </template>
    <template #right>
      <va-navbar-item>
        <router-link to="/" class="nav-link">Oferte</router-link>
      </va-navbar-item>

      <template v-if="!isLoggedIn">
        <va-navbar-item>
          <router-link to="/login" class="nav-link">Login</router-link>
        </va-navbar-item>
        <va-navbar-item>
          <router-link to="/register" class="nav-link">Register</router-link>
        </va-navbar-item>
      </template>

      <template v-else>
        <va-navbar-item>
          <router-link to="/add" class="nav-link">Adaugă Anunț</router-link>
        </va-navbar-item>

        <va-navbar-item v-if="isAdmin">
          <router-link to="/admin" class="nav-link" style="color: #FFD700;">
            <va-icon name="admin_panel_settings" size="small" /> Admin
          </router-link>
        </va-navbar-item>

        <va-navbar-item>
          <span class="user-name">Salut, {{ user?.name }}</span>
        </va-navbar-item>
        <va-navbar-item>
          <va-button color="danger" size="small" @click="handleLogout">Logout</va-button>
        </va-navbar-item>
      </template>
    </template>
  </va-navbar>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'Navbar',
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
.nav-link {
  color: white;
  text-decoration: none;
  margin-right: 15px;
  font-weight: bold;
}
.logo {
  font-weight: bold;
  font-size: 1.2rem;
  color: white;
}
.user-name {
  color: white;
  margin-right: 10px;
}
</style>