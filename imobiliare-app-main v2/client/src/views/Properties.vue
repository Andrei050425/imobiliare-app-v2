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
          <template #cell(image)="{ row }">
            <img :src="getImageUrl(row.source.image_path)" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; display: block;" />
          </template>
          <template #cell(area)="{ value }">{{ value }} mp</template>
          <template #cell(price)="{ value }">{{ value }} €</template>
          <template #cell(status)="{ value }"><va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" /></template>
          <template #cell(actions)="{ row }">
            <va-button preset="plain" icon="edit" @click="$router.push(`/app/properties/edit/${row.source.id}`)" />
            <va-button v-if="isAdmin" preset="plain" color="danger" icon="delete" @click="remove(row.source.id)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vuestic-ui';
import api from '../services/api';
import { SPACE_STATUS } from '../services/labels';

export default {
  name: 'Properties',
  setup() {
    const store = useStore();
    const { init } = useToast();
    const items = ref([]);
    const loading = ref(false);
    const search = ref('');
    const statusFilter = ref(null);
    const isAdmin = computed(() => store.getters.isAdmin);
    const cols = [
      { key: 'image', label: 'Imagine' },
      { key: 'title', label: 'Denumire' },
      { key: 'sector', label: 'Sector' },
      { key: 'area', label: 'Suprafață' },
      { key: 'price', label: 'Preț' },
      { key: 'category_name', label: 'Categorie' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: 'Acțiuni' },
    ];
    const statusOptions = Object.entries(SPACE_STATUS)
      .filter(([value]) => value !== 'MAINTENANCE')
      .map(([value, v]) => ({ value, label: v.label }));
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
    const remove = async (id) => {
      if (!confirm('Ștergi spațiul?')) return;
      try {
        await api.delete(`/properties/${id}`);
        init({ message: 'Spațiu șters cu succes.', color: 'success' });
        load();
      } catch (e) {
        init({ message: 'Eroare la ștergere.', color: 'danger' });
      }
    };
    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=Spatiu';
      return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };
    onMounted(load);
    return { items, loading, search, statusFilter, statusOptions, cols, ST: SPACE_STATUS, isAdmin, load, remove, getImageUrl };
  }
};
</script>
