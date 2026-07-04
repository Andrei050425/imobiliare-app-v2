<template>
  <div>
    <div class="page-title">Acasă — Administrator</div>
    <div v-if="loading" class="text-center"><va-progress-circle indeterminate /></div>
    <div v-else>
      <div class="row">
        <div class="flex xs12 sm6 md3"><kpi label="Grad de ocupare" :value="data.occupancyRate + '%'" :sub="data.occupied + ' din ' + data.totalSpaces + ' spații'" icon="pie_chart" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Facturat luna curentă" :value="fmt(data.invoicedThisMonth) + ' RON'" icon="request_quote" icon-button icon-title="Vezi istoricul pe luni" @icon-click="showMonthlyModal = true" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Încasat luna curentă" :value="fmt(data.collectedThisMonth) + ' RON'" icon="payments" icon-button icon-title="Vezi istoricul pe luni" @icon-click="showMonthlyModal = true" /></div>
        <div class="flex xs12 sm6 md3"><kpi label="Restanțe active" :value="fmt(data.overdueAmount) + ' RON'" :sub="data.overdueTenants + ' chiriași'" icon="warning" color="danger" /></div>
      </div>
      <div class="row mt-2">
        <div class="flex xs12 sm6 md3"><kpi label="Contracte active" :value="data.activeContracts" icon="description" /></div>
      </div>

      <va-card class="mt-4">
        <va-card-title>Contracte care expiră în 30 de zile</va-card-title>
        <va-card-content>
          <va-data-table :items="data.expiringContracts" :columns="cols" no-data-html="Niciun contract aproape de expirare.">
            <template #cell(end_date)="{ value }">
              {{ new Date(value).toLocaleDateString('ro-RO') }}
            </template>
            <template #header(actions)>
              <div style="display: flex; justify-content: flex-end; width: 100%;">
                <div style="width: 185px; text-align: center;">Acțiuni</div>
              </div>
            </template>
            <template #cell(actions)="{ row }">
              <div style="display: flex; justify-content: flex-end; gap: 6px;">
                <va-button size="small" color="info" icon="visibility" @click="openContractDetails(row.source)">Detalii</va-button>
                <va-button size="small" color="warning" icon="update" @click="openExtendModal(row.source)">Extinde</va-button>
              </div>
            </template>
          </va-data-table>
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

      <!-- Modal: Istoric încasări pe luni -->
      <va-modal v-model="showMonthlyModal" title="Istoric încasări și facturări pe lună" hide-default-actions size="large">
        <div class="mb-3" style="color: var(--va-secondary); font-size: 0.9rem;">
          Situația detaliată a sumelor facturate și încasate pentru fiecare lună înregistrată în sistem:
        </div>
        <va-data-table :items="data.monthlyStats || []" :columns="monthlyCols" no-data-html="Nu există date înregistrate.">
          <template #cell(invoiced)="{ value }">
            <span style="font-weight: 600; color: var(--va-text-primary);">{{ fmt(value) }} RON</span>
          </template>
          <template #cell(collected)="{ value }">
            <span style="font-weight: 600; color: var(--va-success);">{{ fmt(value) }} RON</span>
          </template>
          <template #cell(rate)="{ row }">
            <va-badge :color="row.source.invoiced ? (row.source.collected >= row.source.invoiced ? 'success' : 'info') : 'secondary'">
              {{ row.source.invoiced ? Math.round((row.source.collected / row.source.invoiced) * 100) : 0 }}%
            </va-badge>
          </template>
        </va-data-table>
        <template #footer>
          <va-button @click="showMonthlyModal = false">Închide</va-button>
        </template>
      </va-modal>

      <!-- Modal: Detalii contract -->
      <va-modal v-model="showDetailsModal" title="Detalii Contract" hide-default-actions size="medium">
        <div v-if="selectedContract" class="contract-details-grid">
          <va-input :modelValue="selectedContract.contract_number" label="Număr Contract" readonly class="mb-2" />
          <va-input :modelValue="selectedContract.tenant_name" label="Chiriaș" readonly class="mb-2" />
          <va-input :modelValue="selectedContract.property_title" label="Spațiu" readonly class="mb-2" />
          <div class="row">
            <div class="flex xs6">
              <va-input :modelValue="selectedContract.start_date ? new Date(selectedContract.start_date).toLocaleDateString('ro-RO') : '-'" label="Data început" readonly class="mb-2" />
            </div>
            <div class="flex xs6">
              <va-input :modelValue="selectedContract.end_date ? new Date(selectedContract.end_date).toLocaleDateString('ro-RO') : '-'" label="Data expirare" readonly class="mb-2" />
            </div>
          </div>
          <div class="row">
            <div class="flex xs6">
              <va-input :modelValue="(selectedContract.monthly_rent_eur || 0) + ' EUR'" label="Chirie lunară" readonly class="mb-2" />
            </div>
            <div class="flex xs6">
              <va-input :modelValue="(selectedContract.deposit_eur || 0) + ' EUR'" label="Garanție" readonly class="mb-2" />
            </div>
          </div>
          <div class="mt-2">
            <va-badge color="info" text="ACTIV" />
          </div>
        </div>
        <template #footer>
          <va-button @click="showDetailsModal = false">Închide</va-button>
        </template>
      </va-modal>

      <!-- Modal: Extindere contract -->
      <va-modal v-model="showExtendModal" title="Extinde Contract" hide-default-actions size="small">
        <div v-if="selectedContract" class="text-center">
          <p class="mb-3">
            Extinde contractul <strong>{{ selectedContract.contract_number }}</strong>
            pentru chiriașul <strong>{{ selectedContract.tenant_name }}</strong>.
          </p>
          <p class="mb-3" style="color: var(--va-secondary); font-size: 0.85rem;">
            Data curentă de expirare: <strong>{{ selectedContract.end_date ? new Date(selectedContract.end_date).toLocaleDateString('ro-RO') : '-' }}</strong>
          </p>
          <va-input
            v-model.number="extendMonths"
            label="Număr de luni pentru extindere"
            type="number"
            :min="1"
            :max="60"
            class="mb-3"
            style="max-width: 280px; margin: 0 auto;"
          />
        </div>
        <template #footer>
          <div class="d-flex justify-center gap-3 w-full">
            <va-button preset="secondary" @click="showExtendModal = false">Anulează</va-button>
            <va-button color="warning" icon="update" :loading="extending" @click="confirmExtend">Extinde cu {{ extendMonths }} luni</va-button>
          </div>
        </template>
      </va-modal>
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
    const showMonthlyModal = ref(false);
    const showDetailsModal = ref(false);
    const showExtendModal = ref(false);
    const selectedContract = ref(null);
    const extendMonths = ref(12);
    const extending = ref(false);
    const { init } = useToast();

    const cols = [
      { key: 'contract_number', label: 'Contract' },
      { key: 'tenant_name', label: 'Chiriaș' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'end_date', label: 'Expiră' },
      { key: 'actions', label: 'Acțiuni', thAlign: 'right', alignHead: 'right' },
    ];
    const invoiceCols = [
      { key: 'invoice_number', label: 'Nr. factură' },
      { key: 'tenant_name', label: 'Chiriaș' },
      { key: 'due_date', label: 'Scadență' },
      { key: 'total_ron', label: 'Total' },
    ];
    const monthlyCols = [
      { key: 'label', label: 'Luna / Anul' },
      { key: 'invoiced', label: 'Total Facturat' },
      { key: 'collected', label: 'Total Încasat' },
      { key: 'rate', label: 'Rată încasare' },
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
        init({ message: res.data.message, color: 'success' });
        showExtendModal.value = false;
        await load();
      } catch (e) {
        init({ message: e.response?.data?.message || 'Eroare la extindere.', color: 'danger' });
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
