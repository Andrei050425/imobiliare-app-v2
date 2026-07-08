<template>
  <div>
    <div class="page-title d-flex justify-space-between align-center">
      <span>Acasă — Centru de Comandă Administrator</span>
      <n-button secondary size="small" @click="showMonthlyModal = true">
        <template #icon><i class="material-icons">analytics</i></template>
        Istoric Încasări Lunare
      </n-button>
    </div>
    <div v-if="loading" class="text-center" style="padding: 40px; display: flex; justify-content: center;"><n-spin size="large" /></div>
    <div v-else>
      <!-- RANDUL 1: 3 Indicatori Cheie Opraționali -->
      <div class="kpi-row-top">
        <div class="kpi-box glow-emerald kpi-card-spacious">
          <div class="kpi-head">
            <span>Grad de ocupare</span>
            <div class="icon-sq emerald"><i class="material-icons">pie_chart</i></div>
          </div>
          <div class="kpi-num">{{ data.occupancyRate }}%</div>
          <div class="kpi-sub">
            <span class="pill-up"><i class="material-icons">apartment</i></span>
            <span>{{ data.occupied }} din {{ data.totalSpaces }} spații ocupate</span>
          </div>
        </div>

        <div class="kpi-box glow-amber kpi-card-spacious">
          <div class="kpi-head">
            <span>Contracte active</span>
            <div class="icon-sq amber"><i class="material-icons">description</i></div>
          </div>
          <div class="kpi-num">{{ data.activeContracts }}</div>
          <div class="kpi-sub">
            <span class="pill-up" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;"><i class="material-icons">verified</i></span>
            <span>Toate contractele în derulare</span>
          </div>
        </div>

        <div class="kpi-box glow-rose kpi-card-spacious">
          <div class="kpi-head">
            <span>Restanțe active</span>
            <div class="icon-sq rose"><i class="material-icons">warning</i></div>
          </div>
          <div class="kpi-num text-rose">{{ fmt(data.overdueAmount) }} RON</div>
          <div class="kpi-sub">
            <span class="pill-warn">{{ data.overdueTenants }} chiriași</span>
            <span>necesită atenție urgentă</span>
          </div>
        </div>
      </div>

      <!-- RANDUL 2: 2 Indicatori Financiari Detaliați -->
      <div class="kpi-row-bottom">
        <div class="kpi-box glow-indigo kpi-card-spacious" style="cursor: pointer;" @click="showMonthlyModal = true">
          <div class="kpi-head">
            <span>Facturat luna curentă</span>
            <div class="icon-sq indigo"><i class="material-icons">request_quote</i></div>
          </div>
          <div class="kpi-num">{{ fmt(data.invoicedThisMonth) }} RON</div>
          <div class="kpi-sub">
            <span class="pill-up">Vezi luni →</span>
            <span>click pentru istoric detaliat lunar</span>
          </div>
        </div>

        <div class="kpi-box glow-indigo kpi-card-spacious" style="cursor: pointer;" @click="showMonthlyModal = true">
          <div class="kpi-head">
            <span>Încasat luna curentă</span>
            <div class="icon-sq indigo"><i class="material-icons">payments</i></div>
          </div>
          <div class="kpi-num">{{ fmt(data.collectedThisMonth) }} RON</div>
          <div class="kpi-sub">
            <span class="pill-up">Încasări →</span>
            <span>raport lunar complet</span>
          </div>
        </div>
      </div>

      <n-card class="mt-4" style="margin-top: 24px; border-radius: 16px;" title="Contracte care expiră în 30 de zile" :bordered="true">
        <n-data-table v-if="data.expiringContracts && data.expiringContracts.length > 0" :data="data.expiringContracts" :columns="cols" :bordered="false" />
        <div v-else class="compact-empty-state">
          <div class="empty-icon-wrap emerald">
            <i class="material-icons">check_circle</i>
          </div>
          <div>
            <div class="empty-title">Toate contractele sunt în grafic</div>
            <div class="empty-sub">Niciun contract nu expiră în următoarele 30 de zile.</div>
          </div>
        </div>
      </n-card>

      <n-card class="mt-4" style="margin-top: 24px; border-radius: 16px;" :bordered="true">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span>Facturi restante</span>
            <n-button size="small" type="primary" @click="generate" :loading="generating">
              <template #icon><n-icon><i class="material-icons">bolt</i></n-icon></template>
              Generează facturi
            </n-button>
          </div>
        </template>
        <n-data-table v-if="data.overdueInvoices && data.overdueInvoices.length > 0" :data="data.overdueInvoices" :columns="invoiceCols" :bordered="false" />
        <div v-else class="compact-empty-state">
          <div class="empty-icon-wrap emerald">
            <i class="material-icons">verified</i>
          </div>
          <div>
            <div class="empty-title">Nicio factură restantă</div>
            <div class="empty-sub">Toate facturile emise sunt la zi cu plățile.</div>
          </div>
        </div>
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

<style scoped>
.kpi-row-top {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}
.kpi-row-bottom {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}
@media (max-width: 1100px) {
  .kpi-row-top, .kpi-row-bottom {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .kpi-row-top, .kpi-row-bottom {
    grid-template-columns: 1fr;
  }
}
.kpi-card-spacious {
  padding: 26px 28px !important;
  min-height: 160px;
  border-radius: 20px !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #94a3b8;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.icon-sq {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.icon-sq.indigo { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
.icon-sq.emerald { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.icon-sq.amber { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.icon-sq.rose { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
.kpi-num {
  font-size: 2.15rem;
  font-weight: 800;
  color: white;
  margin: 16px 0 10px;
  line-height: 1.1;
}
.text-rose { color: #f87171 !important; }
.kpi-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 4px;
}
.pill-up {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  padding: 4px 10px;
  border-radius: 99px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.pill-warn {
  background: rgba(244, 63, 94, 0.18);
  color: #fb7185;
  padding: 4px 10px;
  border-radius: 99px;
  font-weight: 700;
}
.compact-empty-state {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 6px;
}
.empty-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.empty-icon-wrap.emerald {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}
.empty-icon-wrap i {
  font-size: 24px;
}
.empty-title {
  font-weight: 700;
  color: #f1f5f9;
  font-size: 0.98rem;
}
.empty-sub {
  color: #64748b;
  font-size: 0.84rem;
  margin-top: 2px;
}
</style>
