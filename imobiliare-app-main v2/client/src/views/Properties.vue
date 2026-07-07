<template>
  <div>
    <div class="page-title">Spații comerciale</div>
    <div class="toolbar">
      <n-input v-model:value="search" placeholder="Caută spațiu..." clearable @clear="load" @keyup.enter="load" style="max-width: 300px;">
        <template #prefix><n-icon><i class="material-icons" style="font-size:16px">search</i></n-icon></template>
      </n-input>
      <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="Toate stările" clearable @update:value="load" style="width: 180px;" />
      <span class="spacer"></span>
      <n-button v-if="isAdmin" type="primary" @click="$router.push('/app/properties/add')">
        <template #icon><n-icon><i class="material-icons">add</i></n-icon></template>
        Spațiu nou
      </n-button>
    </div>

    <n-card>
      <n-data-table :columns="columns" :data="items" :loading="loading" :bordered="false" />
    </n-card>

    <!-- Modal Localizare Hartă -->
    <n-modal v-model:show="showMapModal" :title="`Localizare pe hartă: ${selectedProperty?.title || ''}`" preset="card" style="width: 800px;">
      <div v-if="selectedProperty" style="height: 450px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <PropertyMap :properties="[selectedProperty]" @select-property="showMapModal = false" />
      </div>
      <template #footer>
        <n-button @click="showMapModal = false">Închide</n-button>
      </template>
    </n-modal>

    <!-- Modal Detalii Spațiu & Chiriaș/Rezervare -->
    <n-modal v-model:show="showDetailsModal" title="Fișă Tehnică & Detalii Ocupare" preset="card" style="width: 900px;">
      <div v-if="loadingDetails" style="display: flex; justify-content: center; align-items: center; padding: 40px;">
        <n-spin size="medium" />
        <span style="margin-left: 12px; color: #94a3b8;">Se încarcă detaliile spațiului și ale chiriașului...</span>
      </div>

      <div v-else-if="detailsData" class="property-details-view">
        <!-- HEADER SPAȚIU -->
        <div class="details-header">
          <div>
            <h3 style="margin: 0; color: #6366f1;">{{ detailsData.title }}</h3>
            <span style="color: #94a3b8; font-size: 0.85rem;"><i class="material-icons" style="font-size: 14px; vertical-align: middle;">place</i> {{ detailsData.address }}, {{ detailsData.sector }}</span>
          </div>
          <div>
            <n-tag :type="ST[detailsData.status]?.naiveType || 'default'" size="medium">{{ ST[detailsData.status]?.label || detailsData.status }}</n-tag>
          </div>
        </div>

        <div class="details-split-grid" :class="{ 'single-column': !(detailsData.status === 'OCCUPIED' || detailsData.status === 'RESERVED') }">
          <!-- COLOANA STÂNGĂ: DETALII SPAȚIU -->
          <div class="detail-card space-card">
            <div class="card-title-header space-title">
              <i class="material-icons" style="color: #6366f1;">storefront</i> Specificații Spațiu Comercial
            </div>
            
            <div v-if="detailsData.images && detailsData.images.length > 0" style="margin-bottom: 16px; border-radius: 8px; overflow: hidden;">
              <div style="position: relative; height: 220px; background: #1e293b;">
                <img :src="getImageUrl(detailsData.images[detailsImgIdx || 0].path)" style="width: 100%; height: 220px; object-fit: cover; display: block;" />
                <div v-if="detailsData.images.length > 1" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; align-items: center; padding: 0 8px; pointer-events: none;">
                  <button @click.stop="detailsImgIdx = (detailsImgIdx - 1 + detailsData.images.length) % detailsData.images.length" style="pointer-events: auto; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.85); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1e293b;">
                    <i class="material-icons" style="font-size: 18px;">chevron_left</i>
                  </button>
                  <button @click.stop="detailsImgIdx = (detailsImgIdx + 1) % detailsData.images.length" style="pointer-events: auto; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.85); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1e293b;">
                    <i class="material-icons" style="font-size: 18px;">chevron_right</i>
                  </button>
                </div>
                <div v-if="detailsData.images.length > 1" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.75); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                  {{ (detailsImgIdx || 0) + 1 }} / {{ detailsData.images.length }}
                </div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item"><span class="label">Categorie:</span><span class="value font-bold">{{ detailsData.category_name }}</span></div>
              <div class="info-item"><span class="label">Preț lunar:</span><span class="value font-bold" style="color: #6366f1;">{{ detailsData.price }} € / lună</span></div>
              <div class="info-item"><span class="label">Suprafață:</span><span class="value font-bold">{{ detailsData.area }} mp</span></div>
              <div class="info-item"><span class="label">Preț / mp:</span><span class="value font-bold">{{ (detailsData.price / (detailsData.area || 1)).toFixed(2) }} €/mp</span></div>
            </div>

            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
              <span class="label" style="display: block; margin-bottom: 4px;">Descriere:</span>
              <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; white-space: pre-line; max-height: 140px; overflow-y: auto; line-height: 1.5;">{{ detailsData.description || 'Fără descriere.' }}</p>
            </div>
          </div>

          <!-- COLOANA DREAPTĂ: CHIRIAȘ -->
          <div v-if="detailsData.status === 'OCCUPIED' || detailsData.status === 'RESERVED'" class="detail-card" :class="detailsData.status === 'OCCUPIED' ? 'tenant-card-occupied' : 'tenant-card-reserved'">
            <div class="card-title-header" :class="detailsData.status === 'OCCUPIED' ? 'occupied-title' : 'reserved-title'">
              <i class="material-icons">{{ detailsData.status === 'OCCUPIED' ? 'verified_user' : 'pending_actions' }}</i>
              {{ detailsData.status === 'OCCUPIED' ? 'Informații Chiriaș & Contract' : 'Informații Client & Rezervare' }}
            </div>

            <div v-if="detailsData.tenant" class="tenant-info-box">
              <div class="tenant-header">
                <div class="font-bold" style="font-size: 1.1rem;">{{ detailsData.tenant.tenant_name || detailsData.tenant.company_name || 'Client Nespecificat' }}</div>
                <div v-if="detailsData.tenant.legal_rep_name" style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Reprezentant legal: {{ detailsData.tenant.legal_rep_name }}</div>
              </div>

              <div class="info-grid">
                <div class="info-item"><span class="label">Email:</span><span class="value">{{ detailsData.tenant.tenant_email || detailsData.tenant.email || '-' }}</span></div>
                <div class="info-item"><span class="label">Telefon:</span><span class="value font-bold">{{ detailsData.tenant.tenant_phone || detailsData.tenant.phone || '-' }}</span></div>
                <div class="info-item" v-if="detailsData.tenant.cui"><span class="label">CUI / CIF:</span><span class="value">{{ detailsData.tenant.cui }}</span></div>
                <div class="info-item" v-if="detailsData.tenant.reg_no"><span class="label">Nr. Reg. Com.:</span><span class="value">{{ detailsData.tenant.reg_no }}</span></div>
                <div class="info-item xs12" v-if="detailsData.tenant.tenant_address || detailsData.tenant.address"><span class="label">Adresă Sediu:</span><span class="value" style="font-size: 0.75rem;">{{ detailsData.tenant.tenant_address || detailsData.tenant.address }}</span></div>
              </div>

              <div v-if="detailsData.tenant.contract_number" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                  <i class="material-icons" style="font-size: 16px;">description</i> Detalii Contractuale
                </div>
                <div class="info-grid">
                  <div class="info-item"><span class="label">Nr. Contract:</span><span class="value font-bold" style="color: #6366f1;">{{ detailsData.tenant.contract_number }}</span></div>
                  <div class="info-item"><span class="label">Stare Contract:</span><n-tag :type="detailsData.tenant.contract_status === 'ACTIVE' ? 'success' : 'warning'" size="small">{{ detailsData.tenant.contract_status === 'ACTIVE' ? 'Activ' : 'Draft' }}</n-tag></div>
                  <div class="info-item"><span class="label">Perioadă:</span><span class="value" style="font-size: 0.75rem;">{{ formatDate(detailsData.tenant.start_date) }} — {{ formatDate(detailsData.tenant.end_date) }}</span></div>
                  <div class="info-item"><span class="label">Chirie lunară:</span><span class="value font-bold" style="color: #10b981;">{{ detailsData.tenant.monthly_rent_eur }} €</span></div>
                  <div class="info-item" v-if="detailsData.tenant.deposit_eur"><span class="label">Garanție reținută:</span><span class="value">{{ detailsData.tenant.deposit_eur }} €</span></div>
                </div>
              </div>
            </div>

            <div v-else style="text-align: center; padding: 20px; color: #94a3b8;">
              <n-icon size="32" color="#f59e0b"><i class="material-icons">info_outline</i></n-icon>
              <p style="margin: 8px 0 0; font-size: 0.85rem;">Nu a fost identificat un contract activ sau o ofertă online în sistem.</p>
              <p style="font-size: 0.75rem; margin-top: 4px; color: #64748b;">Este posibil ca închirierea sau rezervarea să fi fost operată manual offline.</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <n-button @click="showDetailsModal = false">Închide</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, h } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useMessage, NCard, NDataTable, NButton, NInput, NSelect, NModal, NTag, NSpin, NIcon } from 'naive-ui';
import api from '../services/api';
import { SPACE_STATUS } from '../services/labels';
import PropertyMap from '../components/PropertyMap.vue';

export default {
  name: 'Properties',
  components: { NCard, NDataTable, NButton, NInput, NSelect, NModal, NTag, NSpin, NIcon, PropertyMap },
  setup() {
    const store = useStore();
    const router = useRouter();
    const message = useMessage();
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
    const detailsImgIdx = ref(0);

    const openMapModal = (prop) => {
      selectedProperty.value = prop;
      showMapModal.value = true;
    };

    const openDetailsModal = async (prop) => {
      showDetailsModal.value = true;
      loadingDetails.value = true;
      detailsData.value = null;
      detailsImgIdx.value = 0;
      try {
        const res = await api.get(`/properties/${prop.id}`);
        detailsData.value = res.data;
      } catch (e) {
        console.error(e);
        message.error('Eroare la încărcarea detaliilor.');
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
    
    // Naive UI status mapping
    const statusTypeMap = { FREE: 'success', OCCUPIED: 'info', RESERVED: 'warning', MAINTENANCE: 'error' };
    const ST = {};
    Object.entries(SPACE_STATUS).forEach(([key, val]) => {
      ST[key] = { ...val, naiveType: statusTypeMap[key] || 'default' };
    });

    const columns = computed(() => [
      { title: 'Imagine', key: 'image', width: 80, render(row) { return h('img', { src: getImageUrl(row.image_path), style: 'width: 60px; height: 40px; object-fit: cover; border-radius: 4px; display: block;' }); } },
      { title: 'Denumire', key: 'title' },
      { title: 'Sector', key: 'sector' },
      { title: 'Suprafață', key: 'area', render(row) { return `${row.area} mp`; } },
      { title: 'Preț', key: 'price', render(row) { return `${row.price} €`; } },
      { title: 'Categorie', key: 'category_name' },
      { title: 'Stare', key: 'status', render(row) { const s = ST[row.status]; return h(NTag, { type: s?.naiveType || 'default', size: 'small' }, { default: () => s?.label || row.status }); } },
      { title: 'Acțiuni', key: 'actions', width: 200, render(row) {
        return h('div', { style: 'display: flex; gap: 14px; align-items: center;' }, [
          h(NButton, { text: true, type: 'primary', onClick: () => openDetailsModal(row), title: 'Vezi detalii & chiriaș' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          h(NButton, { text: true, type: 'info', onClick: () => openMapModal(row), title: 'Vezi pe hartă' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'map') }) }),
          h(NButton, { text: true, type: 'primary', onClick: () => router.push(`/app/properties/edit/${row.id}`), title: 'Editează spațiu' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'edit') }) }),
          ...(isAdmin.value ? [h(NButton, { text: true, type: 'error', onClick: () => remove(row.id), title: 'Șterge spațiu' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'delete') }) })] : []),
        ]);
      }},
    ]);

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
        message.success('Spațiu șters cu succes.');
        load();
      } catch (e) {
        message.error('Eroare la ștergere.');
      }
    };
    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=Spatiu';
      return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };
    onMounted(load);
    return { 
      items, loading, search, statusFilter, statusOptions, columns, ST, isAdmin, 
      showMapModal, selectedProperty, openMapModal, 
      showDetailsModal, loadingDetails, detailsData, detailsImgIdx, openDetailsModal, formatDate,
      load, remove, getImageUrl 
    };
  }
};
</script>

<style scoped>
.details-split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; margin-top: 12px; }
.details-split-grid.single-column { grid-template-columns: 1fr; }
@media (max-width: 900px) { .details-split-grid { grid-template-columns: 1fr; gap: 20px; } }
.details-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.04); border-radius: 8px; margin-bottom: 16px; }
.detail-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; }
.detail-card.tenant-card-occupied { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
.detail-card.tenant-card-reserved { border-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
.card-title-header { font-size: 1.05rem; font-weight: 700; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 8px; }
.card-title-header.space-title { color: #e2e8f0; }
.card-title-header.occupied-title { color: #10b981; border-bottom-color: rgba(16, 185, 129, 0.3); }
.card-title-header.reserved-title { color: #f59e0b; border-bottom-color: rgba(245, 158, 11, 0.3); }
.tenant-header { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; margin-bottom: 20px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; }
.info-item { display: flex; flex-direction: column; font-size: 0.85rem; }
.info-item.xs12 { grid-column: span 2; }
.info-item .label { color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
.info-item .value { color: #e2e8f0; margin-top: 4px; }
.font-bold { font-weight: 700; }
</style>
