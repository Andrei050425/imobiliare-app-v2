<template>
  <div>
    <div class="page-title">Acasă — Administrator</div>
    <div v-if="loading" class="text-center" style="padding: 40px; display: flex; justify-content: center;"><n-spin size="large" /></div>
    <div v-else>
      <div class="row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
        <div><kpi label="Grad de ocupare" :value="data.occupancyRate + '%'" :sub="data.occupied + ' din ' + data.totalSpaces + ' spații'" icon="pie_chart" /></div>
        <div><kpi label="Facturat luna curentă" :value="fmt(data.invoicedThisMonth) + ' RON'" icon="request_quote" icon-button icon-title="Vezi istoricul pe luni" @icon-click="showMonthlyModal = true" /></div>
        <div><kpi label="Încasat luna curentă" :value="fmt(data.collectedThisMonth) + ' RON'" icon="payments" icon-button icon-title="Vezi istoricul pe luni" @icon-click="showMonthlyModal = true" /></div>
        <div><kpi label="Restanțe active" :value="fmt(data.overdueAmount) + ' RON'" :sub="data.overdueTenants + ' chiriași'" icon="warning" color="danger" /></div>
      </div>
      <div class="row mt-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 16px;">
        <div><kpi label="Contracte active" :value="data.activeContracts" icon="description" /></div>
      </div>

      <n-card class="mt-4" style="margin-top: 24px;" title="Contracte care expiră în 30 de zile" :bordered="true">
        <n-data-table :data="data.expiringContracts || []" :columns="cols" :bordered="false" />
      </n-card>

      <n-card class="mt-4" style="margin-top: 24px;" :bordered="true">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span>Facturi restante</span>
            <n-button size="small" type="primary" @click="generate" :loading="generating">
              <template #icon><n-icon><i class="material-icons">bolt</i></n-icon></template>
              Generează facturi
            </n-button>
          </div>
        </template>
        <n-data-table :data="data.overdueInvoices || []" :columns="invoiceCols" :bordered="false" />
      </n-card>

      <!-- Modal: Istoric încasări pe luni -->
      <n-modal v-model:show="showMonthlyModal" title="Istoric încasări și facturări pe lună" preset="card" style="width: 700px;">
        <div class="mb-3" style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 12px;">
          Situația detaliată a sumelor facturate și încasate pentru fiecare lună înregistrată în sistem:
        </div>
        <n-data-table :data="data.monthlyStats || []" :columns="monthlyCols" :bordered="false" />
        <template #footer>
          <n-button @click="showMonthlyModal = false">Închide</n-button>
        </template>
      </n-modal>

      <!-- Modal: Detalii contract -->
      <n-modal v-model:show="showDetailsModal" title="Detalii Contract" preset="card" style="width: 500px;">
        <div v-if="selectedContract" class="contract-details-grid">
          <n-form-item label="Număr Contract"><n-input :value="selectedContract.contract_number" readonly /></n-form-item>
          <n-form-item label="Chiriaș"><n-input :value="selectedContract.tenant_name" readonly /></n-form-item>
          <n-form-item label="Spațiu"><n-input :value="selectedContract.property_title" readonly /></n-form-item>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <n-form-item label="Data început"><n-input :value="selectedContract.start_date ? new Date(selectedContract.start_date).toLocaleDateString('ro-RO') : '-'" readonly /></n-form-item>
            <n-form-item label="Data expirare"><n-input :value="selectedContract.end_date ? new Date(selectedContract.end_date).toLocaleDateString('ro-RO') : '-'" readonly /></n-form-item>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <n-form-item label="Chirie lunară"><n-input :value="(selectedContract.monthly_rent_eur || 0) + ' EUR'" readonly /></n-form-item>
            <n-form-item label="Garanție"><n-input :value="(selectedContract.deposit_eur || 0) + ' EUR'" readonly /></n-form-item>
          </div>
          <div style="margin-top: 8px;">
            <n-tag type="info">ACTIV</n-tag>
          </div>
        </div>
        <template #footer>
          <n-button @click="showDetailsModal = false">Închide</n-button>
        </template>
      </n-modal>

      <!-- Modal: Extindere contract -->
      <n-modal v-model:show="showExtendModal" title="Extinde Contract" preset="card" style="width: 450px;">
        <div v-if="selectedContract" style="text-align: center;">
          <p style="margin-bottom: 12px;">
            Extinde contractul <strong>{{ selectedContract.contract_number }}</strong>
            pentru chiriașul <strong>{{ selectedContract.tenant_name }}</strong>.
          </p>
          <p style="margin-bottom: 16px; color: #94a3b8; font-size: 0.85rem;">
            Data curentă de expirare: <strong>{{ selectedContract.end_date ? new Date(selectedContract.end_date).toLocaleDateString('ro-RO') : '-' }}</strong>
          </p>
          <div style="max-width: 280px; margin: 0 auto; text-align: left;">
            <label style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Număr de luni pentru extindere</label>
            <n-input-number
              v-model:value="extendMonths"
              :min="1"
              :max="60"
              style="width: 100%;"
            />
          </div>
        </div>
        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
            <n-button secondary @click="showExtendModal = false">Anulează</n-button>
            <n-button type="warning" :loading="extending" @click="confirmExtend">
              <template #icon><n-icon><i class="material-icons">update</i></n-icon></template>
              Extinde cu {{ extendMonths }} luni
            </n-button>
          </div>
        </template>
      </n-modal>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, h } from 'vue';
import { useMessage, NCard, NDataTable, NButton, NModal, NInput, NInputNumber, NTag, NSpin, NIcon, NFormItem } from 'naive-ui';
import api from '../../services/api';
import Kpi from '../../components/Kpi.vue';

export default {
  name: 'DashboardAdmin',
  components: { Kpi, NCard, NDataTable, NButton, NModal, NInput, NInputNumber, NTag, NSpin, NIcon, NFormItem },
  setup() {
    const data = ref({});
    const loading = ref(true);
    const generating = ref(false);
    const showMonthlyModal = ref(false);
    const showDetailsModal = ref(false);
    const showExtendModal = ref(false);
    const selectedContract = ref(null);
    const extendMonths = ref(12);
    const extending = ref(false);
    const message = useMessage();

    const cols = [
      { key: 'contract_number', title: 'Contract' },
      { key: 'tenant_name', title: 'Chiriaș' },
      { key: 'property_title', title: 'Spațiu' },
      { key: 'end_date', title: 'Expiră', render(row) { return new Date(row.end_date).toLocaleDateString('ro-RO'); } },
      { key: 'actions', title: 'Acțiuni', align: 'right', render(row) {
        return h('div', { style: 'display: flex; justify-content: flex-end; gap: 10px; align-items: center;' }, [
          h(NButton, { size: 'small', type: 'info', secondary: true, onClick: () => openContractDetails(row) }, { default: () => 'Detalii', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          h(NButton, { size: 'small', type: 'warning', secondary: true, onClick: () => openExtendModal(row) }, { default: () => 'Extinde', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'update') }) }),
        ]);
      }},
    ];

    const invoiceCols = [
      { key: 'invoice_number', title: 'Nr. factură' },
      { key: 'tenant_name', title: 'Chiriaș' },
      { key: 'due_date', title: 'Scadență' },
      { key: 'total_ron', title: 'Total', render(row) { return `${fmt(row.total_ron)} RON`; } },
    ];

    const monthlyCols = [
      { key: 'label', title: 'Luna / Anul' },
      { key: 'invoiced', title: 'Total Facturat', render(row) { return h('span', { style: 'font-weight: 600; color: #f1f5f9;' }, `${fmt(row.invoiced)} RON`); } },
      { key: 'collected', title: 'Total Încasat', render(row) { return h('span', { style: 'font-weight: 600; color: #10b981;' }, `${fmt(row.collected)} RON`); } },
      { key: 'rate', title: 'Rată încasare', render(row) {
        const rate = row.invoiced ? Math.round((row.collected / row.invoiced) * 100) : 0;
        const type = row.invoiced ? (row.collected >= row.invoiced ? 'success' : 'info') : 'default';
        return h(NTag, { type, size: 'small' }, { default: () => `${rate}%` });
      }},
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
        message.success(res.data.message);
        await load();
      } catch (e) { message.error('Eroare la generare.'); }
      finally { generating.value = false; }
    };

    const openContractDetails = (contract) => {
      selectedContract.value = contract;
      showDetailsModal.value = true;
    };

    const openExtendModal = (contract) => {
      selectedContract.value = contract;
      extendMonths.value = 12;
      showExtendModal.value = true;
    };

    const confirmExtend = async () => {
      if (!selectedContract.value) return;
      extending.value = true;
      try {
        const res = await api.patch(`/contracts/${selectedContract.value.id}/extend`, { months: extendMonths.value });
        message.success(res.data.message);
        showExtendModal.value = false;
        await load();
      } catch (e) {
        message.error(e.response?.data?.message || 'Eroare la extindere.');
      } finally {
        extending.value = false;
      }
    };

    onMounted(load);
    return {
      data, loading, cols, invoiceCols, monthlyCols, fmt,
      generate, generating,
      showMonthlyModal, showDetailsModal, showExtendModal,
      selectedContract, extendMonths, extending,
      openContractDetails, openExtendModal, confirmExtend,
    };
  }
};
</script>
