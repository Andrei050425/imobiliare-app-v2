<template>
  <div>
    <div class="page-title">Tablou de bord — Tehnic</div>
    <div v-if="loading" class="text-center"><va-progress-circle indeterminate /></div>
    <div v-else>
      <div class="row">
        <div class="flex xs12 sm6 md3"><kpi label="Intervenții deschise" :value="data.open" icon="pending_actions" color="warning" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="În lucru" :value="data.inProgress" icon="engineering" color="info" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Rezolvate" :value="data.resolved" icon="task_alt" color="success" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Spații în întreținere" :value="data.spacesInMaintenance" icon="home_repair_service" color="warning" /></div>
      </div>

      <va-card class="mt-4">
        <va-card-title>Intervenții active</va-card-title>
        <va-card-content>
          <va-data-table :items="data.recent" :columns="cols" no-data-html="Nicio intervenție activă.">
            <template #cell(priority)="{ value }">
              <va-badge :color="prioColor(value)" :text="prioLabel(value)" />
            </template>
            <template #cell(status)="{ value }">
              <va-badge :color="statColor(value)" :text="statLabel(value)" />
            </template>
          </va-data-table>
        </va-card-content>
      </va-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import Kpi from '../../components/Kpi.vue';
import { PRIORITY, MAINT_STATUS } from '../../services/labels';

export default {
  name: 'DashboardTehnic',
  components: { Kpi },
  setup() {
    const data = ref({});
    const loading = ref(true);
    const cols = [
      { key: 'property_title', label: 'Spațiu' },
      { key: 'description', label: 'Descriere' },
      { key: 'priority', label: 'Prioritate' },
      { key: 'status', label: 'Stare' },
    ];
    onMounted(async () => {
      try { data.value = (await api.get('/dashboard/tehnic')).data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return {
      data, loading, cols,
      prioColor: (v) => PRIORITY[v]?.color, prioLabel: (v) => PRIORITY[v]?.label || v,
      statColor: (v) => MAINT_STATUS[v]?.color, statLabel: (v) => MAINT_STATUS[v]?.label || v,
    };
  }
};
</script>
