<template>
  <div>
    <div class="page-title">Spații comerciale</div>
    <div class="toolbar">
      <va-input v-model="search" placeholder="Caută spațiu..." @keyup.enter="load">
        <template #prependInner><va-icon name="search" /></template>
      </va-input>
      <va-select v-model="statusFilter" :options="statusOptions" text-by="label" value-by="value" placeholder="Toate stările" clearable @update:modelValue="load" />
      <span class="spacer"></span>
      <va-button v-if="isAdmin" icon="add" @click="$router.push('/app/properties/add')">Spațiu nou</va-button>
    </div>

    <va-card>
      <va-card-content>
        <va-data-table :items="items" :columns="cols" :loading="loading">
          <template #cell(area)="{ value }">{{ value }} mp</template>
          <template #cell(price)="{ value }">{{ value }} €</template>
          <template #cell(status)="{ value }"><va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" /></template>
          <template #cell(actions)="{ row }">
            <va-button preset="plain" icon="visibility" @click="$router.push(`/property/${row.source.id}`)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import api from '../services/api';
import { SPACE_STATUS } from '../services/labels';

export default {
  name: 'Properties',
  setup() {
    const store = useStore();
    const items = ref([]);
    const loading = ref(false);
    const search = ref('');
    const statusFilter = ref(null);
    const isAdmin = computed(() => store.getters.isAdmin);
    const cols = [
      { key: 'title', label: 'Denumire' },
      { key: 'sector', label: 'Sector' },
      { key: 'area', label: 'Suprafață' },
      { key: 'price', label: 'Preț' },
      { key: 'category_name', label: 'Categorie' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: '' },
    ];
    const statusOptions = Object.entries(SPACE_STATUS).map(([value, v]) => ({ value, label: v.label }));
    const load = async () => {
      loading.value = true;
      try {
        const params = {};
        if (search.value) params.q = search.value;
        if (statusFilter.value) params.status = statusFilter.value;
        items.value = (await api.get('/properties', { params })).data;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    onMounted(load);
    return { items, loading, search, statusFilter, statusOptions, cols, ST: SPACE_STATUS, isAdmin, load };
  }
};
</script>
