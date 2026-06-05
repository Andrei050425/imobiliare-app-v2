<template>
  <component :is="dashboardComponent" />
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import DashboardAdmin from './dashboards/DashboardAdmin.vue';
import DashboardClient from './dashboards/DashboardClient.vue';
import DashboardUser from './dashboards/DashboardUser.vue';

export default {
  name: 'DashboardRouter',
  components: { DashboardAdmin, DashboardClient, DashboardUser },
  setup() {
    const store = useStore();
    const map = {
      admin: 'DashboardAdmin',
      client: 'DashboardClient',
      user: 'DashboardUser',
    };
    const dashboardComponent = computed(() => map[store.getters.userRole] || 'DashboardUser');
    return { dashboardComponent };
  }
};
</script>
