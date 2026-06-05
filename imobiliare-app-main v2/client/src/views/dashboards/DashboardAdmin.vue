<template>
  <div>
    <div class="page-title">Acasă — Administrator</div>
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
      </div>

      <va-card class="mt-4">
        <va-card-title>Contracte care expiră în 30 de zile</va-card-title>
        <va-card-content>
          <va-data-table :items="data.expiringContracts" :columns="cols" no-data-html="Niciun contract aproape de expirare." />
        </va-card-content>
      </va-card>

      <va-card class="mt-4">
        <va-card-title>
          Facturi restante
          <va-spacer />
          <va-button size="small" icon="bolt" @click="generate" :loading="generating">Generează facturi</va-button>
        </va-card-title>
        <va-card-content>
          <va-data-table :items="data.overdueInvoices" :columns="invoiceCols" no-data-html="Nicio factură restantă.">
            <template #cell(total_ron)="{ value }">{{ fmt(value) }} RON</template>
          </va-data-table>
        </va-card-content>
      </va-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'vuestic-ui';
import api from '../../services/api';
import Kpi from '../../components/Kpi.vue';

export default {
  name: 'DashboardAdmin',
  components: { Kpi },
  setup() {
    const data = ref({});
    const loading = ref(true);
    const generating = ref(false);
    const { init } = useToast();
    const cols = [
      { key: 'contract_number', label: 'Contract' },
      { key: 'tenant_name', label: 'Chiriaș' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'end_date', label: 'Expiră' },
    ];
    const invoiceCols = [
      { key: 'invoice_number', label: 'Nr. factură' },
      { key: 'tenant_name', label: 'Chiriaș' },
      { key: 'due_date', label: 'Scadență' },
      { key: 'total_ron', label: 'Total' },
    ];
    const fmt = (n) => Number(n || 0).toLocaleString('ro-RO');
    const load = async () => {
      try { data.value = (await api.get('/dashboard/admin')).data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    const generate = async () => {
      generating.value = true;
      try {
        const res = await api.post('/invoices/generate');
        init({ message: res.data.message, color: 'success' });
        await load();
      } catch (e) { init({ message: 'Eroare la generare.', color: 'danger' }); }
      finally { generating.value = false; }
    };
    onMounted(load);
    return { data, loading, cols, invoiceCols, fmt, generate, generating };
  }
};
</script>
