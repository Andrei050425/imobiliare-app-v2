<template>
  <div>
    <div class="page-title">Contractele mele</div>
    <div class="neo-table-card">
      <div v-if="loading" class="text-center py-5"><n-spin size="large" /></div>
      <table v-else class="neo-table">
        <thead>
          <tr>
            <th>Nr. Contract</th>
            <th>Spațiu Închiriat</th>
            <th>Perioadă Contractuală</th>
            <th>Chirie Lunară</th>
            <th>Stare</th>
            <th style="text-align: right;">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td><span class="code-pill">{{ item.contract_number || 'DRAFT' }}</span></td>
            <td><strong style="color: white;">{{ item.property_title }}</strong></td>
            <td>
              <div>{{ fmtDate(item.start_date) }} → {{ fmtDate(item.end_date) }}</div>
            </td>
            <td><strong style="color: #34d399;">{{ item.monthly_rent_eur }} €</strong></td>
            <td>
              <span class="status-chip" :class="item.status === 'ACTIVE' ? 'active' : item.status === 'DRAFT' ? 'pending' : 'danger'">
                {{ ST[item.status]?.label || item.status }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="icon-btn" title="Vizualizează" @click="openViewModal(item)"><i class="material-icons" style="font-size:18px">visibility</i></button>
                <button class="icon-btn" title="Descarcă PDF" @click="downloadPdf(item.id, item.contract_number)"><i class="material-icons" style="font-size:18px">picture_as_pdf</i></button>
              </div>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="6" class="text-center py-4" style="color: #64748b;">Nu ai niciun contract înregistrat.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <n-modal v-model:show="showViewModal" title="Detalii Contract de Închiriere" preset="card" style="width: 650px;">
      <div v-if="selectedContract" class="contract-view-grid">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <n-form-item label="Număr Contract"><n-input :value="selectedContract.contract_number || 'DRAFT'" readonly /></n-form-item>
          <n-form-item label="Stare Contract"><n-input :value="ST[selectedContract.status]?.label || selectedContract.status" readonly /></n-form-item>
        </div>
        <n-form-item label="Chiriaș (Titular)"><n-input :value="selectedContract.tenant_name || 'N/A'" readonly /></n-form-item>
        <n-form-item label="Spațiu închiriat"><n-input :value="selectedContract.property_title || 'N/A'" readonly /></n-form-item>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
          <n-form-item label="Data Început"><n-input :value="selectedContract.start_date" readonly /></n-form-item>
          <n-form-item label="Data Expirare"><n-input :value="selectedContract.end_date" readonly /></n-form-item>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 12px;">
          <n-form-item label="Chirie lunară"><n-input :value="(selectedContract.monthly_rent_eur || 0) + ' €'" readonly /></n-form-item>
          <n-form-item label="Garanție"><n-input :value="(selectedContract.deposit_eur || 0) + ' €'" readonly /></n-form-item>
          <n-form-item label="Zi de facturare"><n-input :value="`Ziua ${selectedContract.billing_day || 1}`" readonly /></n-form-item>
        </div>
        <div v-if="selectedContract.status === 'TERMINATED' && selectedContract.termination_reason" style="margin-top: 12px;">
          <n-form-item label="Motiv Reziliere"><n-input :value="selectedContract.termination_reason" readonly type="textarea" /></n-form-item>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <n-button type="info" @click="downloadPdf(selectedContract.id, selectedContract.contract_number)">
            <template #icon><n-icon><i class="material-icons">picture_as_pdf</i></n-icon></template>
            Descarcă PDF
          </n-button>
          <n-button @click="showViewModal = false">Închide</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showModal" title="Motiv Reziliere Contract" preset="card" style="width: 450px;">
      <div style="white-space: pre-line; margin-bottom: 1.5rem; color: #cbd5e1;">
        {{ currentReason }}
      </div>
      <template #footer>
        <n-button @click="showModal = false">Închide</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, onMounted, h } from 'vue';
import { useMessage, NCard, NDataTable, NButton, NModal, NInput, NTag, NIcon, NFormItem } from 'naive-ui';
import api from '../../services/api';
import { CONTRACT_STATUS } from '../../services/labels';

export default {
  name: 'MyContracts',
  components: { NCard, NDataTable, NButton, NModal, NInput, NTag, NIcon, NFormItem },
  setup() {
    const message = useMessage();
    const items = ref([]); 
    const loading = ref(true);
    const showModal = ref(false);
    const currentReason = ref('');
    const ST = CONTRACT_STATUS;
    const statusTypeMap = { DRAFT: 'warning', ACTIVE: 'success', TERMINATED: 'error', EXPIRED: 'default' };

    const cols = [
      { key: 'contract_number', title: 'Nr. contract' },
      { key: 'property_title', title: 'Spațiu' },
      { key: 'period', title: 'Perioadă', render(row) { return `${row.start_date} → ${row.end_date}`; } },
      { key: 'monthly_rent_eur', title: 'Chirie', render(row) { return `${row.monthly_rent_eur} €`; } },
      { key: 'status', title: 'Stare', render(row) { const s = ST[row.status]; return h(NTag, { type: statusTypeMap[row.status] || 'default', size: 'small' }, { default: () => s?.label || row.status }); } },
      { key: 'actions', title: '', width: 240, render(row) {
        return h('div', { style: 'display: flex; gap: 10px; align-items: center;' }, [
          h(NButton, { size: 'small', type: 'info', secondary: true, onClick: () => openViewModal(row), title: 'Vizualizare contract' }, { default: () => 'Vezi', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          h(NButton, { size: 'small', type: 'info', secondary: true, onClick: () => downloadPdf(row.id, row.contract_number), title: 'Descarcă contract (PDF)' }, { default: () => 'PDF', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'picture_as_pdf') }) }),
          ...(row.status === 'TERMINATED' ? [
            h(NButton, { size: 'small', type: 'error', secondary: true, onClick: () => showReason(row.termination_reason || 'Niciun motiv specificat pentru această reziliere.') }, { default: () => 'Motiv', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'info') }) })
          ] : [])
        ]);
      }},
    ];

    const showReason = (reason) => {
      currentReason.value = reason;
      showModal.value = true;
    };

    const downloadPdf = async (id, ctrNumber) => {
      try {
        const res = await api.get(`/contracts/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `contract-${ctrNumber || 'draft'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (e) {
        message.error('Eroare la descărcarea PDF-ului');
      }
    };

    const showViewModal = ref(false);
    const selectedContract = ref(null);
    const openViewModal = (contract) => {
      selectedContract.value = contract;
      showViewModal.value = true;
    };

    const fmtDate = (d) => {
      if (!d) return '';
      return new Date(d).toLocaleDateString('ro-RO');
    };

    onMounted(async () => {
      try { items.value = (await api.get('/contracts/mine')).data; } catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { items, loading, cols, ST, fmtDate, showModal, currentReason, showReason, downloadPdf, showViewModal, selectedContract, openViewModal };
  }
};
</script>
