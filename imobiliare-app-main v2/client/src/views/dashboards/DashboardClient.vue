<template>
  <div>
    <div class="page-title">Bun venit, {{ data.tenantName || 'client' }}</div>
    <div v-if="loading" class="text-center"><va-progress-circle indeterminate /></div>
    <div v-else-if="data.noTenant">
      <va-alert color="info">Contul tău nu este încă asociat unui chiriaș. Contactează administratorul.</va-alert>
    </div>
    <div v-else>
      <va-card v-if="data.nextInvoice" class="mb-4" :color="dueColor" gradient>
        <va-card-content>
          <div class="d-flex justify-space-between align-center">
            <div>
              <div style="font-size:0.9rem;opacity:.9;">De plată</div>
              <div style="font-size:1.8rem;font-weight:700;">{{ fmt(data.nextInvoice.total_ron) }} RON</div>
              <div style="font-size:0.85rem;opacity:.9;">Factura {{ data.nextInvoice.invoice_number }} · scadență {{ data.nextInvoice.due_date }}</div>
            </div>
            <va-button preset="secondary" color="#ffffff" @click="$router.push('/app/my-invoices')">Vezi facturile</va-button>
          </div>
        </va-card-content>
      </va-card>

      <div class="row">
        <div class="flex xs12 sm4"><kpi label="Contracte active" :value="data.activeContracts" icon="description" /></div>
        <div class="flex xs12 sm4"><kpi label="Sold restant" :value="fmt(data.outstanding) + ' RON'" icon="account_balance_wallet" :color="data.outstanding > 0 ? 'danger' : 'success'" /></div>
        <div class="flex xs12 sm4"><kpi label="Intervenții deschise" :value="data.openMaintenance" icon="build" /></div>
      </div>

      <div class="mt-3">
        <va-button icon="add" @click="$router.push('/app/my-maintenance')">Solicită o intervenție</va-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import api from '../../services/api';
import Kpi from '../../components/Kpi.vue';

export default {
  name: 'DashboardClient',
  components: { Kpi },
  setup() {
    const data = ref({});
    const loading = ref(true);
    const fmt = (n) => Number(n || 0).toLocaleString('ro-RO');
    const dueColor = computed(() => {
      if (!data.value.nextInvoice) return 'primary';
      return data.value.nextInvoice.status === 'OVERDUE' ? 'danger' : 'warning';
    });
    onMounted(async () => {
      try { data.value = (await api.get('/dashboard/client')).data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { data, loading, fmt, dueColor };
  }
};
</script>
