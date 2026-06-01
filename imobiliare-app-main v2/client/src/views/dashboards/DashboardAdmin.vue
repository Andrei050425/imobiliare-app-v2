<template>
  <div>
    <div class="page-title">Tablou de bord — Administrator</div>
    <div v-if="loading" class="text-center"><va-progress-circle indeterminate /></div>
    <div v-else>
      <div class="row">
        <div class="flex xs12 sm6 md3"><kpi label="Grad de ocupare" :value="data.occupancyRate + '%'" :sub="data.occupied + ' din ' + data.totalSpaces + ' spații'" icon="pie_chart" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Facturat luna curentă" :value="fmt(data.invoicedThisMonth) + ' RON'" icon="request_quote" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Încasat luna curentă" :value="fmt(data.collectedThisMonth) + ' RON'" icon="payments" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Restanțe active" :value="fmt(data.overdueAmount) + ' RON'" :sub="data.overdueTenants + ' chiriași'" icon="warning" color="danger" /></div>
      </div>
      <div class="row mt-2">
        <div class="flex xs12 sm6 md3"><kpi label="Contracte active" :value="data.activeContracts" icon="description" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Intervenții deschise" :value="data.openMaintenance" icon="build" color="warning" /></div>
      </div>

      <va-card class="mt-4">
        <va-card-title>Contracte care expiră în 30 de zile</va-card-title>
        <va-card-content>
          <va-data-table :items="data.expiringContracts" :columns="cols" no-data-html="Niciun contract aproape de expirare." />
        </va-card-content>
      </va-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import Kpi from '../../components/Kpi.vue';

export default {
  name: 'DashboardAdmin',
  components: { Kpi },
  setup() {
    const data = ref({});
    const loading = ref(true);
    const cols = [
      { key: 'contract_number', label: 'Contract' },
      { key: 'tenant_name', label: 'Chiriaș' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'end_date', label: 'Expiră' },
    ];
    const fmt = (n) => Number(n || 0).toLocaleString('ro-RO');
    onMounted(async () => {
      try { data.value = (await api.get('/dashboard/admin')).data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { data, loading, cols, fmt };
  }
};
</script>
