<template>
  <div>
    <va-navbar color="primary">
      <template #left>
        <va-navbar-item>
          <router-link to="/" class="brand">
            <va-icon name="apartment" class="mr-2" /> SANTA Imobiliare
          </router-link>
        </va-navbar-item>
      </template>
      <template #right>
        <template v-if="!isLoggedIn">
          <va-navbar-item>
            <va-button preset="secondary" color="#ffffff" to="/login">Autentificare</va-button>
          </va-navbar-item>
        </template>
        <template v-else>
          <va-navbar-item>
            <va-button color="#ffffff" preset="secondary" to="/app/dashboard">
              <va-icon name="dashboard" class="mr-1" /> Panou
            </va-button>
          </va-navbar-item>
        </template>
      </template>
    </va-navbar>

    <div class="public-content">
      <slot />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
export default {
  name: 'PublicLayout',
  setup() {
    const store = useStore();
    return { isLoggedIn: computed(() => store.getters.isLoggedIn) };
  }
};
</script>

<style scoped>
.brand { color: #fff; text-decoration: none; font-weight: 700; font-size: 1.2rem; display: flex; align-items: center; }
.public-content { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
</style>
