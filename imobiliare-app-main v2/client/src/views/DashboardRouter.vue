<template>
  <component :is="dashboardComponent" />
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import DashboardAdmin from './dashboards/DashboardAdmin.vue';
import DashboardContabil from './dashboards/DashboardContabil.vue';
import DashboardTehnic from './dashboards/DashboardTehnic.vue';
import DashboardClient from './dashboards/DashboardClient.vue';

export default {
  name: 'DashboardRouter',
  components: { DashboardAdmin, DashboardContabil, DashboardTehnic, DashboardClient },
  setup() {
    const store = useStore();
    const map = {
      admin: 'DashboardAdmin',
      contabil: 'DashboardContabil',
      tehnic: 'DashboardTehnic',
      client: 'DashboardClient',
    };
    const dashboardComponent = computed(() => map[store.getters.userRole] || 'DashboardClient');
    return { dashboardComponent };
  }
};
</script>
