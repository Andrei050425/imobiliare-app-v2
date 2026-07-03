<template>
  <div class="catalog-split-page">
    <div class="hero mb-3">
      <h1 class="page-title">Spații comerciale și birouri în București</h1>
      <p class="page-subtitle">Găsește spațiul ideal pentru afacerea ta pe harta interactivă SANTA</p>
    </div>

    <!-- Bara de filtre sus (fixă) -->
    <va-card class="filter-bar mb-3">
      <va-card-content class="py-2 px-3">
        <div class="toolbar d-flex flex-wrap gap-3 align-center">
          <va-input v-model="filters.q" placeholder="Caută după denumire, stradă, zonă..." clearable @clear="fetchProperties" @update:modelValue="val => { if (!val) fetchProperties(); }" @keyup.enter="fetchProperties" class="grow">
            <template #prependInner><va-icon name="search" color="secondary" /></template>
          </va-input>
          <va-select v-model="filters.sector" :options="sectors" placeholder="Toate sectoarele" clearable style="min-width: 150px;" />
          <va-select v-model="filters.category_id" :options="categories" text-by="name" value-by="id" placeholder="Toate tipurile" clearable style="min-width: 170px;" />
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

    <!-- Split-Screen Container (Fix pe înălțimea ecranului) -->
    <div v-else class="split-layout">
      <!-- Stânga: Lista de Proprietăți (Singura zonă cu scroll vertical!) -->
      <div class="list-column">
        <div class="d-flex justify-space-between align-center mb-3 pr-2">
          <span class="result-count"><strong>{{ properties.length }}</strong> proprietăți găsite</span>
        </div>

        <div v-if="properties.length === 0" class="empty-state text-center py-5">
          <va-icon name="location_off" size="large" color="secondary" class="mb-2" />
          <p class="text-secondary">Niciun spațiu nu corespunde filtrelor selectate.</p>
          <va-button preset="secondary" size="small" class="mt-2" @click="resetFilters">Resetează filtrele</va-button>
        </div>

        <div v-else class="property-list pr-2">
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

      <!-- Dreapta: Harta Interactivă (Complet Fixă, fără scroll) -->
      <div class="map-column">
        <div class="map-wrapper">
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
/* --- PAGINĂ FIXĂ PE ÎNĂLȚIMEA ECRANULUI --- */
.catalog-split-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 112px); /* 100vh minus navbar (64px) minus padding AppLayout (48px) */
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Outfit', sans-serif;
  overflow: hidden; /* Fără scroll pe pagina generală */
}

.hero {
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.page-subtitle {
  color: #64748b;
  margin: 2px 0 0;
  font-size: 0.95rem;
}

.filter-bar {
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  border-radius: 12px;
  flex-shrink: 0;
}
.grow {
  flex: 1;
  min-width: 200px;
}

/* --- SPLIT LAYOUT (50% Listă stânga, 50% Hartă dreapta) --- */
.split-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0; /* Critic pentru flexbox shrink și scroll intern */
  overflow: hidden;
}

/* Coloana Stânga: LISTA DE PROPRIETĂȚI (Singura cu scroll!) */
.list-column {
  flex: 1;
  width: 50%;
  max-width: 50%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* Custom Scrollbar pentru lista din stânga */
.list-column::-webkit-scrollbar {
  width: 6px;
}
.list-column::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}
.list-column::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.list-column::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Coloana Dreapta: HARTA (Complet Fixă!) */
.map-column {
  flex: 1;
  width: 50%;
  max-width: 50%;
  height: 100%;
  overflow: hidden;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08);
}

.map-wrapper :deep(.property-map-container) {
  height: 100% !important;
  min-height: 100% !important;
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
  flex-shrink: 0;
}

.property-card:hover,
.property-card.hovered-card {
  transform: translateY(-3px) scale(1.008);
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.15);
  border-color: #10b981;
}

.card-horizontal {
  display: flex;
  height: 170px;
}

.card-image-box {
  position: relative;
  width: 200px;
  min-width: 200px;
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
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.property-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.property-price {
  font-size: 1.2rem;
  font-weight: 800;
  color: #10b981;
  white-space: nowrap;
  margin-left: 8px;
}

.property-address {
  font-size: 0.85rem;
  margin: 4px 0 10px 0;
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
  gap: 14px;
  font-size: 0.88rem;
  color: #475569;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.details-link {
  font-weight: 600;
}

/* Responsive: pe ecrane mai mici, stivuim pe verticală și lăsăm scroll normal */
@media (max-width: 1024px) {
  .catalog-split-page {
    height: auto;
    overflow: visible;
  }
  .split-layout {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }
  .list-column, .map-column {
    width: 100%;
    max-width: 100%;
    height: auto;
    overflow: visible;
  }
  .map-wrapper {
    height: 450px;
    margin-top: 20px;
  }
  .card-horizontal {
    height: auto;
    flex-direction: column;
  }
  .card-image-box {
    width: 100%;
    height: 180px;
  }
}
</style>
