<template>
  <div>
    <div class="page-title">Bun venit, {{ data.tenantName || 'chiriaș' }}</div>
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
              <div style="font-size:1.8rem;font-weight:700;">{{ fmt(data.unpaidCount > 1 ? data.outstanding : data.nextInvoice.total_ron) }} RON</div>
              <div v-if="data.unpaidCount > 1" style="font-size:0.95rem;font-weight:600;opacity:.95;">
                Ai de plătit {{ data.unpaidCount }} facturi
              </div>
              <div v-else style="font-size:0.85rem;opacity:.9;">
                Factura {{ data.nextInvoice.invoice_number }} · scadență {{ formatDate(data.nextInvoice.due_date) }}
              </div>
            </div>
            <va-button preset="secondary" color="#ffffff" @click="$router.push('/app/my-invoices')">Vezi facturile</va-button>
          </div>
        </va-card-content>
      </va-card>

      <div class="row">
        <div class="flex xs12 sm6"><kpi label="Contracte active" :value="data.activeContracts" icon="description" /></div>
        <div class="flex xs12 sm6"><kpi label="Sold restant" :value="fmt(data.outstanding) + ' RON'" icon="account_balance_wallet" :color="data.outstanding > 0 ? 'danger' : 'success'" /></div>
      </div>

      <div v-if="data.rentedProperties && data.rentedProperties.length" class="mt-4">
        <h4 class="va-h5 mb-3" style="color: var(--va-secondary)">Spațiile mele</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          <va-card v-for="prop in data.rentedProperties" :key="prop.id" style="border: 1px solid #eee; overflow: hidden;">
            <img :src="getImageUrl(prop.image_path)" style="width:100%; height:180px; object-fit:cover" />
            <va-card-content>
              <div style="font-weight: 700; font-size: 1.15rem; margin-bottom: 0.5rem">{{ prop.title }}</div>
              <div style="color: var(--va-secondary); font-size: 0.9rem; margin-bottom: 0.5rem">
                <va-icon name="location_on" size="small" /> {{ prop.address }}
              </div>
              <div style="color: var(--va-text-primary); font-size: 0.95rem; margin-bottom: 1rem;">
                <va-icon name="aspect_ratio" size="small" /> {{ prop.area }} m²
              </div>
              <va-button preset="secondary" color="primary" class="w-full" @click="$router.push(`/property/${prop.id}`)">Vizualizare detalii</va-button>
            </va-card-content>
          </va-card>
        </div>
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
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('ro-RO');
    };
    onMounted(async () => {
      try { data.value = (await api.get('/dashboard/client')).data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    const getImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/300x200?text=Fara+Poza';
      return `http://localhost:3000/${path.replace(/\\/g, "/")}`;
    };

    return { data, loading, fmt, dueColor, formatDate, getImageUrl };
  }
};
</script>
