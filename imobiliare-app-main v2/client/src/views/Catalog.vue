<template>
  <div class="catalog-split-page">
    <div class="hero mb-4">
      <h1 class="page-title">Spații comerciale și birouri în București</h1>
      <p class="page-subtitle">Găsește spațiul ideal pentru afacerea ta pe harta interactivă SANTA</p>
    </div>

    <!-- Bara de filtre sus -->
    <va-card class="filter-bar mb-4">
      <va-card-content>
        <div class="toolbar d-flex flex-wrap gap-3 align-center">
          <va-input v-model="filters.q" placeholder="Caută după denumire, stradă, zonă..." class="grow">
            <template #prependInner><va-icon name="search" color="secondary" /></template>
          </va-input>
          <va-select v-model="filters.sector" :options="sectors" placeholder="Toate sectoarele" clearable style="min-width: 160px;" />
          <va-select v-model="filters.category_id" :options="categories" text-by="name" value-by="id" placeholder="Toate tipurile" clearable style="min-width: 180px;" />
          <va-button color="primary" @click="fetchProperties">
            <va-icon name="filter_list" class="mr-1" /> Caută
          </va-button>
        </div>
      </va-card-content>
    </va-card>

    <div v-if="loading" class="text-center my-5 py-5">
      <va-progress-circle indeterminate color="primary" />
      <p class="mt-2 text-secondary">Se încarcă spațiile și harta...</p>
    </div>

    <!-- Split-Screen Container -->
    <div v-else class="split-layout">
      <!-- Stânga: Lista de Proprietăți -->
      <div class="list-column">
        <div class="d-flex justify-space-between align-center mb-3">
          <span class="result-count"><strong>{{ properties.length }}</strong> proprietăți găsite</span>
        </div>

        <div v-if="properties.length === 0" class="empty-state text-center py-5">
          <va-icon name="location_off" size="large" color="secondary" class="mb-2" />
          <p class="text-secondary">Niciun spațiu nu corespunde filtrelor selectate.</p>
          <va-button preset="secondary" size="small" class="mt-2" @click="resetFilters">Resetează filtrele</va-button>
        </div>

        <div v-else class="property-list">
          <va-card 
            v-for="p in properties" 
            :key="p.id" 
            class="property-card mb-3"
            :class="{ 'hovered-card': hoveredId === p.id }"
            @mouseenter="hoveredId = p.id"
            @mouseleave="hoveredId = null"
            @click="goToDetails(p.id)"
          >
            <div class="card-horizontal">
              <div class="card-image-box">
                <va-image :src="getImageUrl(p.image_path)" fit="cover" class="card-img" />
                <va-badge :color="catColor(p.category_name)" :text="p.category_name || 'Comercial'" class="img-badge" />
              </div>
              <div class="card-details-box">
                <div class="d-flex justify-space-between align-start">
                  <h3 class="property-title">{{ p.title }}</h3>
                  <span class="property-price">{{ formatPrice(p.price) }} €</span>
                </div>
                <p class="property-address text-secondary">
                  <va-icon name="place" size="small" color="secondary" /> {{ p.address }} · <strong>{{ p.sector || 'București' }}</strong>
                </p>
                <div class="property-meta mt-auto">
                  <div class="meta-item">
                    <va-icon name="straighten" size="small" color="secondary" /> <span><strong>{{ p.area }}</strong> m²</span>
                  </div>
                  <div class="meta-item">
                    <va-icon name="payments" size="small" color="secondary" /> <span><strong>{{ Math.round(p.price / p.area) }}</strong> €/m²</span>
                  </div>
                  <va-button preset="secondary" size="small" class="ml-auto details-link">Detalii →</va-button>
                </div>
              </div>
            </div>
          </va-card>
        </div>
      </div>

      <!-- Dreapta: Harta Interactivă (Sticky) -->
      <div class="map-column">
        <div class="sticky-map-wrapper">
          <PropertyMap 
            :properties="properties" 
            :hoveredId="hoveredId" 
            @select-property="goToDetails" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import PropertyMap from '../components/PropertyMap.vue';

export default {
  name: 'Catalog',
  components: { PropertyMap },
  setup() {
    const properties = ref([]);
    const categories = ref([]);
    const loading = ref(true);
    const hoveredId = ref(null);
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
      } catch (e) { 
        console.error(e); 
      } finally { 
        loading.value = false; 
      }
    };

    const resetFilters = () => {
      filters.q = '';
      filters.sector = null;
      filters.category_id = null;
      fetchProperties();
    };

    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=SANTA+Spatiu';
      return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };

    const formatPrice = (val) => {
      if (!val && val !== 0) return "0";
      return Number(val).toLocaleString("ro-RO");
    };

    const catColor = (name) => {
      if (!name) return 'secondary';
      if (name.includes('Birou')) return 'info';
      if (name.includes('Comercial') || name.includes('Retail')) return 'warning';
      return 'success';
    };

    const goToDetails = (id) => router.push(`/property/${id}`);

    onMounted(async () => {
      try {
        const res = await api.get('/categories');
        categories.value = res.data;
      } catch (e) {
        categories.value = [
          { id: 1, name: 'Birouri' }, 
          { id: 2, name: 'Comercial / Retail' },
          { id: 3, name: 'Industrial / Hale' }, 
          { id: 4, name: 'Terenuri' },
        ];
      }
      fetchProperties();
    });

    return { 
      properties, 
      categories, 
      sectors, 
      filters, 
      loading, 
      hoveredId,
      fetchProperties, 
      resetFilters,
      getImageUrl, 
      formatPrice,
      catColor, 
      goToDetails 
    };
  }
};
</script>

<style scoped>
.catalog-split-page {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 16px;
  font-family: 'Outfit', sans-serif;
}

.hero {
  margin-bottom: 1rem;
}
.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.page-subtitle {
  color: #64748b;
  margin: 4px 0 0;
  font-size: 1rem;
}

.filter-bar {
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  border-radius: 12px;
}
.grow {
  flex: 1;
  min-width: 220px;
}

/* --- SPLIT LAYOUT (50% Listă stânga, 50% Hartă dreapta) --- */
.split-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.list-column {
  flex: 1;
  width: 50%;
  max-width: 50%;
}

.map-column {
  flex: 1;
  width: 50%;
  max-width: 50%;
}

.sticky-map-wrapper {
  position: sticky;
  top: 80px;
  height: calc(100vh - 120px);
  min-height: 600px;
  width: 100%;
}

/* --- CARD PROPRIETATE IN LISTA --- */
.result-count {
  font-size: 0.95rem;
  color: #64748b;
}

.property-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.property-card:hover,
.property-card.hovered-card {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 24px -6px rgba(16, 185, 129, 0.15);
  border-color: #10b981;
}

.card-horizontal {
  display: flex;
  height: 180px;
}

.card-image-box {
  position: relative;
  width: 220px;
  min-width: 220px;
  height: 100%;
  background: #f1f5f9;
}

.card-img {
  width: 100%;
  height: 100%;
}

.img-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.card-details-box {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.property-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.property-price {
  font-size: 1.25rem;
  font-weight: 800;
  color: #10b981;
  white-space: nowrap;
  margin-left: 8px;
}

.property-address {
  font-size: 0.85rem;
  margin: 6px 0 12px 0;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.property-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.9rem;
  color: #475569;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.details-link {
  font-weight: 600;
}

/* Responsive: pe ecrane mai mici, stivuim pe verticală */
@media (max-width: 1024px) {
  .split-layout {
    flex-direction: column;
  }
  .list-column, .map-column {
    width: 100%;
    max-width: 100%;
  }
  .sticky-map-wrapper {
    position: relative;
    top: 0;
    height: 500px;
    margin-top: 24px;
  }
  .card-horizontal {
    height: auto;
    flex-direction: column;
  }
  .card-image-box {
    width: 100%;
    height: 200px;
  }
}
</style>
