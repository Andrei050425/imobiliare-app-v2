<template>
  <div>
    <div class="page-title">Bun venit, {{ data.tenantName || 'chiriaș' }}</div>
    <div v-if="loading" class="text-center" style="padding: 40px; display: flex; justify-content: center;"><n-spin size="large" /></div>
    <div v-else-if="data.noTenant" style="margin-top: 16px;">
      <n-alert type="info" :bordered="true">Contul tău nu este încă asociat unui chiriaș. Contactează administratorul.</n-alert>
    </div>
    <div v-else>
      <n-card v-if="data.nextInvoice" class="mb-4" :bordered="true" style="margin-bottom: 24px; background: rgba(99, 102, 241, 0.1); border-color: #6366f1;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="font-size:0.9rem; color: #94a3b8;">De plată</div>
            <div style="font-size:1.8rem; font-weight:700; color: #f1f5f9;">{{ fmt(data.unpaidCount > 1 ? data.totalToPay : data.nextInvoice.total_ron) }} RON</div>
            <div v-if="data.unpaidCount > 1" style="font-size:0.95rem; font-weight:600; color: #cbd5e1;">
              Ai de plătit {{ data.unpaidCount }} facturi
            </div>
            <div v-else style="font-size:0.85rem; color: #94a3b8;">
              Factura {{ data.nextInvoice.invoice_number }} · scadență {{ formatDate(data.nextInvoice.due_date) }}
            </div>
          </div>
          <n-button type="primary" @click="$router.push('/app/my-invoices')">Vezi facturile</n-button>
        </div>
      </n-card>

      <div class="row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <div><kpi label="Contracte active" :value="data.activeContracts" icon="description" /></div>
        <div><kpi label="Sold restant (restant după 7 zile de neachitare a facturii emise iar penalizare de 1%/zi până la plata facturii restante)" :value="fmt(data.outstanding) + ' RON'" icon="account_balance_wallet" :color="data.outstanding > 0 ? 'danger' : 'success'" /></div>
      </div>

      <div v-if="data.rentedProperties && data.rentedProperties.length" class="mt-4" style="margin-top: 32px;">
        <h4 style="color: #94a3b8; font-size: 1.2rem; margin-bottom: 16px;">Spațiile mele</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          <n-card v-for="prop in data.rentedProperties" :key="prop.id" :bordered="true" content-style="padding: 0; overflow: hidden;">
            <img :src="getImageUrl(prop.image_path)" style="width:100%; height:180px; object-fit:cover; display: block;" />
            <div style="padding: 16px;">
              <div style="font-weight: 700; font-size: 1.15rem; margin-bottom: 0.5rem; color: #f1f5f9;">{{ prop.title }}</div>
              <div style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 4px;">
                <i class="material-icons" style="font-size: 16px;">location_on</i> {{ prop.address }}
              </div>
              <div style="color: #cbd5e1; font-size: 0.95rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 4px;">
                <i class="material-icons" style="font-size: 16px;">aspect_ratio</i> {{ prop.area }} m²
              </div>
              <n-button secondary type="primary" block @click="$router.push(`/property/${prop.id}`)">Vizualizare detalii</n-button>
            </div>
          </n-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { NCard, NButton, NSpin, NAlert } from 'naive-ui';
import api from '../../services/api';
import Kpi from '../../components/Kpi.vue';

export default {
  name: 'DashboardClient',
  components: { Kpi, NCard, NButton, NSpin, NAlert },
  setup() {
    const data = ref({});
    const loading = ref(true);
    const fmt = (n) => Number(n || 0).toLocaleString('ro-RO');
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

    return { data, loading, fmt, formatDate, getImageUrl };
  }
};
</script>
