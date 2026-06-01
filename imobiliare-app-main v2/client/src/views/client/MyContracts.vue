<template>
  <div>
    <div class="page-title">Contractele mele</div>
    <va-card>
      <va-card-content>
        <va-data-table :items="items" :columns="cols" :loading="loading" no-data-html="Nu ai contracte.">
          <template #cell(monthly_rent_eur)="{ value }">{{ value }} €</template>
          <template #cell(period)="{ row }">{{ row.source.start_date }} → {{ row.source.end_date }}</template>
          <template #cell(status)="{ value }"><va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" /></template>
        </va-data-table>
      </va-card-content>
    </va-card>
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
    const cols = [
      { key: 'contract_number', label: 'Nr. contract' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'period', label: 'Perioadă' },
      { key: 'monthly_rent_eur', label: 'Chirie' },
      { key: 'status', label: 'Stare' },
    ];
    onMounted(async () => {
      try { items.value = (await api.get('/contracts/mine')).data; } catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { items, loading, cols, ST: CONTRACT_STATUS };
  }
};
</script>
