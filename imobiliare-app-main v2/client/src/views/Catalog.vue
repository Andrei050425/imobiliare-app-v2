<template>
  <div class="catalog-split-page">
    <div class="hero mb-3">
      <h1 class="page-title">Spații comerciale și birouri în București</h1>
      <p class="page-subtitle">Găsește spațiul ideal pentru afacerea ta pe harta interactivă SANTA</p>
    </div>

    <!-- Bara de filtre sus (fixă pe un singur rând orizontal) -->
    <n-card class="filter-bar mb-3" :bordered="true" content-style="padding: 12px 16px;">
      <div class="catalog-filters-row">
        <n-input v-model:value="filters.q" placeholder="Caută după denumire, stradă, zonă..." clearable @clear="fetchProperties" @update:value="val => { if (!val) fetchProperties(); }" @keyup.enter="fetchProperties" class="filter-search-input">
          <template #prefix><n-icon><i class="material-icons" style="font-size:16px">search</i></n-icon></template>
        </n-input>
        <n-select v-model:value="filters.sector" :options="sectorOptions" placeholder="Toate sectoarele" clearable class="filter-select-sector" />
        <n-select v-model:value="filters.category_id" :options="categoryOptions" placeholder="Toate tipurile" clearable class="filter-select-type" />
        <n-button type="primary" @click="fetchProperties" class="filter-btn-search">
          <template #icon><n-icon><i class="material-icons">filter_list</i></n-icon></template>
          Caută
        </n-button>
      </div>
    </n-card>

    <div v-if="loading" class="text-center my-5 py-5">
      <n-spin size="large" />
      <p class="mt-2 text-secondary" style="margin-top: 12px;">Se încarcă spațiile și harta...</p>
    </div>

    <!-- Split-Screen Container (Fix pe înălțimea ecranului) -->
    <div v-else class="split-layout">
      <!-- Stânga: Lista de Proprietăți (Singura zonă cu scroll vertical!) -->
      <div class="list-column">
        <div class="d-flex justify-space-between align-center mb-3 pr-2" style="margin-bottom: 12px;">
          <span class="result-count"><strong>{{ properties.length }}</strong> proprietăți găsite</span>
        </div>

        <div v-if="properties.length === 0" class="empty-state text-center py-5">
          <n-icon size="48" color="#64748b" style="margin-bottom: 8px;"><i class="material-icons">location_off</i></n-icon>
          <p class="text-secondary">Niciun spațiu nu corespunde filtrelor selectate.</p>
          <n-button secondary size="small" style="margin-top: 8px;" @click="resetFilters">Resetează filtrele</n-button>
        </div>

        <div v-else class="property-list pr-2">
          <n-card 
            v-for="p in properties" 
            :key="p.id" 
            class="property-card mb-3"
            :class="{ 'hovered-card': hoveredId === p.id }"
            :bordered="true"
            @mouseenter="hoveredId = p.id"
            @mouseleave="hoveredId = null"
            @click="goToDetails(p.id)"
            style="margin-bottom: 12px;"
            content-style="padding: 0;"
          >
            <div class="card-horizontal">
              <div class="card-image-box">
                <img :src="getImageUrl(p.image_path)" class="card-img" />
                <n-tag :type="catColor(p.category_name)" size="small" class="img-badge">{{ p.category_name || 'Comercial' }}</n-tag>
              </div>
              <div class="card-details-box">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <h3 class="property-title">{{ p.title }}</h3>
                  <span class="property-price">{{ formatPrice(p.price) }} €</span>
                </div>
                <p class="property-address text-secondary">
                  <i class="material-icons" style="font-size: 16px;">place</i> {{ p.address }} · <strong>{{ p.sector || 'București' }}</strong>
                </p>
                <div class="property-meta mt-auto">
                  <div class="meta-item">
                    <i class="material-icons" style="font-size: 16px;">straighten</i> <span><strong>{{ p.area }}</strong> m²</span>
                  </div>
                  <div class="meta-item">
                    <i class="material-icons" style="font-size: 16px;">payments</i> <span><strong>{{ Math.round(p.price / p.area) }}</strong> €/m²</span>
                  </div>
                  <n-button secondary size="small" style="margin-left: auto;" class="details-link">Detalii →</n-button>
                </div>
              </div>
            </div>
          </n-card>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NInput, NSelect, NButton, NIcon, NSpin, NTag, useNotification } from 'naive-ui';
import api from '../services/api';
import PropertyMap from '../components/PropertyMap.vue';

export default {
  name: 'Catalog',
  components: { NCard, NInput, NSelect, NButton, NIcon, NSpin, NTag, PropertyMap },
  setup() {
    const notification = useNotification();
    const properties = ref([]);
    const categories = ref([]);
    const loading = ref(true);
    const hoveredId = ref(null);
    const router = useRouter();
    const sectors = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6'];
    const filters = reactive({ q: '', sector: null, category_id: null });

    const sectorOptions = computed(() => sectors.map(s => ({ value: s, label: s })));
    const categoryOptions = computed(() => categories.value.map(c => ({ value: c.id, label: c.name })));

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
      if (!name) return 'default';
      if (name.includes('Birou')) return 'info';
      if (name.includes('Comercial') || name.includes('Retail')) return 'warning';
      return 'success';
    };

    const goToDetails = (id) => router.push(`/property/${id}`);

    onMounted(async () => {
      if (sessionStorage.getItem('justRegistered') === 'true') {
        sessionStorage.removeItem('justRegistered');
        notification.success({
          title: 'Bine ai venit în comunitatea SANTA!',
          content: 'Contul tău a fost creat cu succes. Pentru moment, ai acces de utilizator și poți explora catalogul de spații sau trimite oferte.',
          duration: 8000,
        });
      }
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
      sectorOptions,
      categoryOptions,
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
  height: calc(100vh - 112px);
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
}

.hero {
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}
.page-subtitle {
  color: #94a3b8;
  margin: 2px 0 0;
  font-size: 0.95rem;
}

.filter-bar {
  border-radius: 12px;
  flex-shrink: 0;
}
.catalog-filters-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.catalog-filters-row .filter-search-input {
  flex: 1;
  min-width: 240px;
}
.catalog-filters-row .filter-select-sector {
  width: 200px;
  flex-shrink: 0;
}
.catalog-filters-row .filter-select-type {
  width: 200px;
  flex-shrink: 0;
}
.catalog-filters-row .filter-btn-search {
  flex-shrink: 0;
}

.split-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

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

.list-column::-webkit-scrollbar { width: 6px; }
.list-column::-webkit-scrollbar-track { background: #1e1e2e; border-radius: 4px; }
.list-column::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
.list-column::-webkit-scrollbar-thumb:hover { background: #475569; }

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
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
}

.map-wrapper :deep(.property-map-container) {
  height: 100% !important;
  min-height: 100% !important;
}

.result-count { font-size: 0.95rem; color: #94a3b8; }

.property-card {
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  flex-shrink: 0;
}

.property-card:hover,
.property-card.hovered-card {
  transform: translateY(-3px) scale(1.008);
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.25);
  border-color: #6366f1 !important;
}

.card-horizontal { display: flex; height: 170px; }
.card-image-box { position: relative; width: 200px; min-width: 200px; height: 100%; background: #1e293b; }
.card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-badge { position: absolute; top: 10px; left: 10px; z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
.card-details-box { flex: 1; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
.property-title { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.property-price { font-size: 1.2rem; font-weight: 800; color: #10b981; white-space: nowrap; margin-left: 8px; }
.property-address { font-size: 0.85rem; margin: 4px 0 10px 0; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #94a3b8; }
.property-meta { display: flex; align-items: center; gap: 14px; font-size: 0.88rem; color: #cbd5e1; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 10px; }
.meta-item { display: flex; align-items: center; gap: 4px; }
.details-link { font-weight: 600; }

@media (max-width: 1024px) {
  .catalog-split-page { height: auto; overflow: visible; }
  .split-layout { flex-direction: column; height: auto; overflow: visible; }
  .list-column, .map-column { width: 100%; max-width: 100%; height: auto; overflow: visible; }
  .map-wrapper { height: 450px; margin-top: 20px; }
  .card-horizontal { height: auto; flex-direction: column; }
  .card-image-box { width: 100%; height: 180px; }
}
</style>
