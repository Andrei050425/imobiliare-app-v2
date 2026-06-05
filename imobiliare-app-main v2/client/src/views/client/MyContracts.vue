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
import api from '../../services/api';
import { CONTRACT_STATUS } from '../../services/labels';
export default {
  name: 'MyContracts',
  setup() {
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

    onMounted(async () => {
      try { items.value = (await api.get('/contracts/mine')).data; } catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { items, loading, cols, ST: CONTRACT_STATUS, showModal, currentReason, showReason };
  }
};
</script>
