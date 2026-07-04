<template>
  <div>
    <div class="page-title">Contractele mele</div>
    <va-card>
      <va-card-content>
        <va-data-table :items="items" :columns="cols" :loading="loading" no-data-html="Nu ai contracte.">
          <template #cell(monthly_rent_eur)="{ value }">{{ value }} €</template>
          <template #cell(period)="{ row }">{{ row.source.start_date }} → {{ row.source.end_date }}</template>
          <template #cell(status)="{ value }"><va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" /></template>
          <template #cell(actions)="{ row }">
            <va-button
              size="small"
              color="info"
              preset="secondary"
              icon="visibility"
              title="Vizualizare contract"
              @click="openViewModal(row.source)"
            >
              Vezi
            </va-button>
            <va-button
              size="small"
              color="info"
              preset="secondary"
              icon="picture_as_pdf"
              title="Descarcă contract (PDF)"
              @click="downloadPdf(row.source.id, row.source.contract_number)"
            >
              PDF
            </va-button>
            <va-button
              v-if="row.source.status === 'TERMINATED'"
              size="small"
              color="danger"
              preset="secondary"
              icon="info"
              @click="showReason(row.source.termination_reason || 'Niciun motiv specificat pentru această reziliere.')"
            >
              Motiv reziliere
            </va-button>
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <va-modal v-model="showViewModal" title="Detalii Contract de Închiriere" hide-default-actions size="medium">
      <div v-if="selectedContract" class="contract-view-grid">
        <div class="row mb-3">
          <div class="flex xs6">
            <va-input :modelValue="selectedContract.contract_number || 'DRAFT'" label="Număr Contract" readonly />
          </div>
          <div class="flex xs6">
            <va-input :modelValue="ST[selectedContract.status]?.label || selectedContract.status" label="Stare Contract" readonly />
          </div>
        </div>
        <va-input :modelValue="selectedContract.tenant_name || 'N/A'" label="Chiriaș (Titular)" readonly class="mb-3" />
        <va-input :modelValue="selectedContract.property_title || 'N/A'" label="Spațiu închiriat" readonly class="mb-3" />
        <div class="row mb-3">
          <div class="flex xs6">
            <va-input :modelValue="selectedContract.start_date" label="Data Început" readonly />
          </div>
          <div class="flex xs6">
            <va-input :modelValue="selectedContract.end_date" label="Data Expirare" readonly />
          </div>
        </div>
        <div class="row mb-3">
          <div class="flex xs4">
            <va-input :modelValue="(selectedContract.monthly_rent_eur || 0) + ' €'" label="Chirie lunară" readonly />
          </div>
          <div class="flex xs4">
            <va-input :modelValue="(selectedContract.deposit_eur || 0) + ' €'" label="Garanție" readonly />
          </div>
          <div class="flex xs4">
            <va-input :modelValue="`Ziua ${selectedContract.billing_day || 1}`" label="Zi de facturare" readonly />
          </div>
        </div>
        <div v-if="selectedContract.status === 'TERMINATED' && selectedContract.termination_reason" class="mb-3">
          <va-input :modelValue="selectedContract.termination_reason" label="Motiv Reziliere" readonly type="textarea" />
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-between w-full">
          <va-button color="info" icon="picture_as_pdf" @click="downloadPdf(selectedContract.id, selectedContract.contract_number)">Descarcă PDF</va-button>
          <va-button @click="showViewModal = false">Închide</va-button>
        </div>
      </template>
    </va-modal>

    <va-modal v-model="showModal" title="Motiv Reziliere Contract" hide-default-actions>
      <div style="white-space: pre-line; margin-bottom: 1.5rem;">
        {{ currentReason }}
      </div>
      <template #footer>
        <va-button @click="showModal = false">Închide</va-button>
      </template>
    </va-modal>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'vuestic-ui';
import api from '../../services/api';
import { CONTRACT_STATUS } from '../../services/labels';
export default {
  name: 'MyContracts',
  setup() {
    const { init } = useToast();
    const items = ref([]); const loading = ref(true);
    const showModal = ref(false);
    const currentReason = ref('');

    const cols = [
      { key: 'contract_number', label: 'Nr. contract' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'period', label: 'Perioadă' },
      { key: 'monthly_rent_eur', label: 'Chirie' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: '' },
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
        init({ message: 'Eroare la descărcarea PDF-ului', color: 'danger' });
      }
    };

    const showViewModal = ref(false);
    const selectedContract = ref(null);
    const openViewModal = (contract) => {
      selectedContract.value = contract;
      showViewModal.value = true;
    };

    onMounted(async () => {
      try { items.value = (await api.get('/contracts/mine')).data; } catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { items, loading, cols, ST: CONTRACT_STATUS, showModal, currentReason, showReason, downloadPdf, showViewModal, selectedContract, openViewModal };
  }
};
</script>
