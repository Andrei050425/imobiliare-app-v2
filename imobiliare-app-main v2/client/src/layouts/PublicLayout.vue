<template>
  <div>
    <header class="public-navbar">
      <div class="navbar-left">
        <router-link to="/" class="brand">
          <n-icon size="20"><i class="material-icons">apartment</i></n-icon>
          SANTA Imobiliare
        </router-link>
      </div>
      <div class="navbar-right">
        <template v-if="!isLoggedIn">
          <n-button quaternary tag="a" @click="$router.push('/login')">Autentificare</n-button>
        </template>
        <template v-else>
          <n-button quaternary @click="$router.push('/app/dashboard')">
            <template #icon><n-icon><i class="material-icons">dashboard</i></n-icon></template>
            Panou
          </n-button>
        </template>
      </div>
    </header>

    <div class="public-content">
      <slot />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { NButton, NIcon } from 'naive-ui';
export default {
  name: 'PublicLayout',
  components: { NButton, NIcon },
  setup() {
    const store = useStore();
    return { isLoggedIn: computed(() => store.getters.isLoggedIn) };
  }
};
</script>

<style scoped>
.public-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  background: linear-gradient(135deg, #312e81, #4338ca);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
.navbar-left { display: flex; align-items: center; }
.navbar-right { display: flex; align-items: center; gap: 8px; }
.brand { color: #fff; text-decoration: none; font-weight: 700; font-size: 1.2rem; display: flex; align-items: center; gap: 8px; }
.public-content { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
</style>
