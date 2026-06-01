<template>
  <div>
    <div class="hero">
      <h1>Spații comerciale disponibile</h1>
      <p>Caută și filtrează portofoliul SANTA</p>
    </div>

    <va-card class="filter-bar mb-4">
      <va-card-content>
        <div class="toolbar">
          <va-input v-model="filters.q" placeholder="Caută după denumire sau adresă..." class="grow">
            <template #prependInner><va-icon name="search" /></template>
          </va-input>
          <va-select v-model="filters.sector" :options="sectors" placeholder="Toate sectoarele" clearable />
          <va-select v-model="filters.category_id" :options="categories" text-by="name" value-by="id" placeholder="Toate tipurile" clearable />
          <va-button @click="fetchProperties">Caută</va-button>
        </div>
      </va-card-content>
    </va-card>

    <div v-if="loading" class="text-center"><va-progress-circle indeterminate /></div>

    <div v-else>
      <p class="result-count">{{ properties.length }} spații disponibile</p>
      <div class="row">
        <div class="flex xs12 sm6 md4 lg3" v-for="p in properties" :key="p.id">
          <va-card class="item-card mb-4">
            <va-image :src="getImageUrl(p.image_path)" style="height: 170px;" fit="cover" />
            <va-card-content>
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="title-txt">{{ p.title }}</span>
                <va-badge color="success" text="Disponibil" />
              </div>
              <div class="text--secondary mb-1"><va-icon name="place" size="small" /> {{ p.address }} · {{ p.sector || '—' }}</div>
              <div class="stats">
                <span><va-icon name="straighten" size="small" /> {{ p.area }} mp</span>
                <span><va-icon name="sell" size="small" /> {{ p.price }} €</span>
              </div>
              <div class="d-flex justify-space-between align-center mt-2">
                <va-badge :color="catColor(p.category_name)" :text="p.category_name" />
                <va-button preset="secondary" size="small" @click="goToDetails(p.id)">Detalii</va-button>
              </div>
            </va-card-content>
          </va-card>
        </div>
        <div v-if="properties.length === 0" class="flex xs12 text-center">
          <p>Niciun spațiu nu corespunde filtrelor selectate.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

export default {
  name: 'Catalog',
  setup() {
    const properties = ref([]);
    const categories = ref([]);
    const loading = ref(true);
    const router = useRouter();
    const sectors = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6'];
    const filters = reactive({ q: '', sector: null, category_id: null });

    const fetchProperties = async () => {
      loading.value = true;
      try {
        const params = { status: 'FREE' };
        if (filters.q) params.q = filters.q;
        if (filters.sector) params.sector = filters.sector;
        if (filters.category_id) params.category_id = filters.category_id;
        const res = await api.get('/properties', { params });
        properties.value = res.data;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=Spatiu';
      return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };
    const catColor = (name) => {
      if (!name) return 'secondary';
      if (name.includes('Birou')) return 'info';
      if (name.includes('Comercial')) return 'warning';
      return 'success';
    };
    const goToDetails = (id) => router.push(`/property/${id}`);

    onMounted(async () => {
      try {
        const res = await api.get('/categories');
        categories.value = res.data;
      } catch (e) {
        categories.value = [
          { id: 1, name: 'Birouri' }, { id: 2, name: 'Comercial / Retail' },
          { id: 3, name: 'Industrial / Hale' }, { id: 4, name: 'Terenuri' },
        ];
      }
      fetchProperties();
    });

    return { properties, categories, sectors, filters, loading, fetchProperties, getImageUrl, catColor, goToDetails };
  }
};
</script>

<style scoped>
.hero { margin-bottom: 1.2rem; }
.hero h1 { font-size: 1.8rem; margin: 0; }
.hero p { color: #6b7280; margin: 4px 0 0; }
.grow { flex: 1; min-width: 220px; }
.result-count { color: #6b7280; margin-bottom: 1rem; }
.title-txt { font-weight: 600; }
.stats { display: flex; gap: 14px; color: #6b7280; font-size: 0.9rem; }
.item-card { transition: transform .2s; }
.item-card:hover { transform: translateY(-4px); }
</style>
