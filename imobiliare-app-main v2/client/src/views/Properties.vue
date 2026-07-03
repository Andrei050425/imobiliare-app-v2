<template>
  <div>
    <div class="page-title">Spații comerciale</div>
    <div class="toolbar">
      <va-input v-model="search" placeholder="Caută spațiu..." clearable @clear="load" @update:modelValue="val => { if (!val) load(); }" @keyup.enter="load">
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
            <va-button preset="plain" icon="visibility" title="Vezi detalii & chiriaș" @click="openDetailsModal(row.source)" />
            <va-button preset="plain" icon="map" title="Vezi pe hartă" @click="openMapModal(row.source)" />
            <va-button preset="plain" icon="edit" title="Editează spațiu" @click="$router.push(`/app/properties/edit/${row.source.id}`)" />
            <va-button v-if="isAdmin" preset="plain" color="danger" icon="delete" title="Șterge spațiu" @click="remove(row.source.id)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <!-- Modal Localizare Hartă -->
    <va-modal v-model="showMapModal" :title="`Localizare pe hartă: ${selectedProperty?.title || ''}`" size="large" hide-default-actions>
      <div v-if="selectedProperty" style="height: 450px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <PropertyMap :properties="[selectedProperty]" @select-property="showMapModal = false" />
      </div>
      <template #footer>
        <va-button preset="secondary" @click="showMapModal = false">Închide</va-button>
      </template>
    </va-modal>

    <!-- Modal Detalii Spațiu & Chiriaș/Rezervare -->
    <va-modal v-model="showDetailsModal" title="Fișă Tehnică & Detalii Ocupare" size="large" hide-default-actions>
      <div v-if="loadingDetails" class="d-flex justify-center align-center py-5">
        <va-progress-circle indeterminate color="primary" />
        <span class="ml-3 text--secondary">Se încarcă detaliile spațiului și ale chiriașului...</span>
      </div>

      <div v-else-if="detailsData" class="property-details-view">
        <!-- HEADER SPAȚIU -->
        <div class="details-header mb-4 p-3 bg-light rounded d-flex justify-space-between align-center">
          <div>
            <h3 class="m-0 text-primary d-flex align-center gap-2">
              {{ detailsData.title }}
            </h3>
            <span class="text--secondary text-sm"><va-icon name="place" size="small" /> {{ detailsData.address }}, {{ detailsData.sector }}</span>
          </div>
          <div>
            <va-badge :color="ST[detailsData.status]?.color" :text="ST[detailsData.status]?.label || detailsData.status" size="large" />
          </div>
        </div>

        <div class="details-split-grid" :class="{ 'single-column': !(detailsData.status === 'OCCUPIED' || detailsData.status === 'RESERVED') }">
          <!-- COLOANA STÂNGĂ / SUS: DETALII SPAȚIU COMERCIAL -->
          <div class="detail-card space-card">
            <div class="card-title-header space-title">
              <va-icon name="storefront" color="primary" /> Specificații Spațiu Comercial
            </div>
            
            <div v-if="detailsData.images && detailsData.images.length > 0" class="mb-4 rounded-lg overflow-hidden border shadow-sm" style="max-height: 220px;">
              <img :src="getImageUrl(detailsData.images[0].path)" style="width: 100%; height: 220px; object-fit: cover; display: block;" />
            </div>

            <div class="info-grid mt-2">
              <div class="info-item">
                <span class="label">Categorie:</span>
                <span class="value font-bold">{{ detailsData.category_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">Preț lunar:</span>
                <span class="value text-primary font-bold text-md">{{ detailsData.price }} € / lună</span>
              </div>
              <div class="info-item">
                <span class="label">Suprafață:</span>
                <span class="value font-bold">{{ detailsData.area }} mp</span>
              </div>
              <div class="info-item">
                <span class="label">Preț / mp:</span>
                <span class="value font-bold">{{ (detailsData.price / (detailsData.area || 1)).toFixed(2) }} €/mp</span>
              </div>
            </div>

            <div class="mt-4 pt-3 border-top">
              <span class="label d-block mb-1">Descriere:</span>
              <p class="text-sm text--secondary m-0" style="white-space: pre-line; max-height: 140px; overflow-y: auto; line-height: 1.5;">{{ detailsData.description || 'Fără descriere.' }}</p>
            </div>
          </div>

          <!-- COLOANA DREAPTĂ / JOS: DETALII PERSOANĂ / CHIRIAȘ (DOAR PENTRU OCUPAT / REZERVAT) -->
          <div v-if="detailsData.status === 'OCCUPIED' || detailsData.status === 'RESERVED'" class="detail-card" :class="detailsData.status === 'OCCUPIED' ? 'tenant-card-occupied' : 'tenant-card-reserved'">
            <div class="card-title-header" :class="detailsData.status === 'OCCUPIED' ? 'occupied-title' : 'reserved-title'">
              <va-icon :name="detailsData.status === 'OCCUPIED' ? 'verified_user' : 'pending_actions'" /> 
              {{ detailsData.status === 'OCCUPIED' ? 'Informații Chiriaș & Contract' : 'Informații Client & Rezervare' }}
            </div>

            <div v-if="detailsData.tenant" class="tenant-info-box">
              <div class="tenant-header mb-4 p-3 rounded-lg bg-white shadow-sm border">
                <div class="font-bold text-lg text-dark">{{ detailsData.tenant.tenant_name || detailsData.tenant.company_name || 'Client Nespecificat' }}</div>
                <div v-if="detailsData.tenant.legal_rep_name" class="text-xs text--secondary mt-1">Reprezentant legal: {{ detailsData.tenant.legal_rep_name }}</div>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Email:</span>
                  <span class="value">{{ detailsData.tenant.tenant_email || detailsData.tenant.email || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Telefon:</span>
                  <span class="value font-bold">{{ detailsData.tenant.tenant_phone || detailsData.tenant.phone || '-' }}</span>
                </div>
                <div class="info-item" v-if="detailsData.tenant.cui">
                  <span class="label">CUI / CIF:</span>
                  <span class="value">{{ detailsData.tenant.cui }}</span>
                </div>
                <div class="info-item" v-if="detailsData.tenant.reg_no">
                  <span class="label">Nr. Reg. Com.:</span>
                  <span class="value">{{ detailsData.tenant.reg_no }}</span>
                </div>
                <div class="info-item xs12" v-if="detailsData.tenant.tenant_address || detailsData.tenant.address">
                  <span class="label">Adresă Sediu:</span>
                  <span class="value text-xs">{{ detailsData.tenant.tenant_address || detailsData.tenant.address }}</span>
                </div>
              </div>

              <!-- SECȚIUNE CONTRACT (Dacă există contract) -->
              <div v-if="detailsData.tenant.contract_number" class="mt-4 pt-3 border-top">
                <div class="text-xs font-bold text-uppercase text--secondary mb-3 d-flex align-center gap-1">
                  <va-icon name="description" size="small" /> Detalii Contractuale
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Nr. Contract:</span>
                    <span class="value font-bold text-primary">{{ detailsData.tenant.contract_number }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Stare Contract:</span>
                    <div><va-badge :color="detailsData.tenant.contract_status === 'ACTIVE' ? 'success' : 'warning'" :text="detailsData.tenant.contract_status === 'ACTIVE' ? 'Activ' : 'Draft'" size="small" /></div>
                  </div>
                  <div class="info-item">
                    <span class="label">Perioadă:</span>
                    <span class="value text-xs font-medium">{{ formatDate(detailsData.tenant.start_date) }} — {{ formatDate(detailsData.tenant.end_date) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Chirie lunară:</span>
                    <span class="value font-bold text-success text-md">{{ detailsData.tenant.monthly_rent_eur }} €</span>
                  </div>
                  <div class="info-item" v-if="detailsData.tenant.deposit_eur">
                    <span class="label">Garanție reținută:</span>
                    <span class="value">{{ detailsData.tenant.deposit_eur }} €</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-5 text--secondary bg-white rounded-lg border p-4 mt-2">
              <va-icon name="info_outline" size="large" class="mb-2 text-warning" />
              <p class="m-0 text-sm font-medium">Nu a fost identificat un contract activ sau o ofertă online în sistem.</p>
              <p class="text-xs mt-1 text--secondary">Este posibil ca închirierea sau rezervarea să fi fost operată manual offline.</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <va-button preset="secondary" @click="showDetailsModal = false">Închide</va-button>
      </template>
    </va-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vuestic-ui';
import api from '../services/api';
import { SPACE_STATUS } from '../services/labels';
import PropertyMap from '../components/PropertyMap.vue';

export default {
  name: 'Properties',
  components: { PropertyMap },
  setup() {
    const store = useStore();
    const { init } = useToast();
    const items = ref([]);
    const loading = ref(false);
    const search = ref('');
    const statusFilter = ref(null);
    const showMapModal = ref(false);
    const selectedProperty = ref(null);
    
    // Stări modal detalii
    const showDetailsModal = ref(false);
    const loadingDetails = ref(false);
    const detailsData = ref(null);

    const openMapModal = (prop) => {
      selectedProperty.value = prop;
      showMapModal.value = true;
    };

    const openDetailsModal = async (prop) => {
      showDetailsModal.value = true;
      loadingDetails.value = true;
      detailsData.value = null;
      try {
        const res = await api.get(`/properties/${prop.id}`);
        detailsData.value = res.data;
      } catch (e) {
        console.error(e);
        init({ message: 'Eroare la încărcarea detaliilor.', color: 'danger' });
      } finally {
        loadingDetails.value = false;
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

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
    return { 
      items, loading, search, statusFilter, statusOptions, cols, ST: SPACE_STATUS, isAdmin, 
      showMapModal, selectedProperty, openMapModal, 
      showDetailsModal, loadingDetails, detailsData, openDetailsModal, formatDate,
      load, remove, getImageUrl 
    };
  }
};
</script>

<style scoped>
.details-split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;
  margin-top: 12px;
}
.details-split-grid.single-column {
  grid-template-columns: 1fr;
}
@media (max-width: 900px) {
  .details-split-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.detail-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}
.detail-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}
.detail-card.tenant-card-occupied {
  background: #f8fef9;
  border: 1px solid #10b981;
}
.detail-card.tenant-card-reserved {
  background: #fffefb;
  border: 1px solid #f59e0b;
}

.card-title-header {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-title-header.space-title {
  color: #1e293b;
}
.card-title-header.occupied-title {
  color: #047857;
  border-bottom-color: #a7f3d0;
}
.card-title-header.reserved-title {
  color: #b45309;
  border-bottom-color: #fde68a;
}

.tenant-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
}
.info-item.xs12 {
  grid-column: span 2;
}
.info-item .label {
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.info-item .value {
  color: #1e293b;
  margin-top: 4px;
}
.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.border-top {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.bg-light {
  background-color: #f8fafc;
}
.font-bold {
  font-weight: 700;
}
.font-medium {
  font-weight: 500;
}
.text-md {
  font-size: 1rem;
}
</style>
