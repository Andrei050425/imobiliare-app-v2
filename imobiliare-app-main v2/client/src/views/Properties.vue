<template>
  <div>
    <div class="page-title">Spații comerciale</div>
    <div class="neo-inline-filters mb-3">
      <n-input v-model:value="search" placeholder="Caută spațiu..." clearable @clear="load" @keyup.enter="load" style="max-width: 300px;">
        <template #prefix><n-icon><i class="material-icons" style="font-size:16px">search</i></n-icon></template>
      </n-input>
      <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="Toate stările" clearable @update:value="load" style="width: 180px;" />
      <span class="spacer"></span>
      <n-button v-if="isAdmin" type="primary" @click="openCreateModal">
        <template #icon><n-icon><i class="material-icons">add</i></n-icon></template>
        Spațiu nou
      </n-button>
    </div>

    <div class="neo-table-card">
      <div v-if="loading" class="text-center py-5"><n-spin size="large" /></div>
      <table v-else class="neo-table">
        <thead>
          <tr>
            <th>Imagine</th>
            <th>Denumire Spațiu</th>
            <th>Categorie</th>
            <th>Sector</th>
            <th>Suprafață</th>
            <th>Preț</th>
            <th>Status</th>
            <th style="text-align: right;">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <img :src="getImageUrl(item.image_path)" style="width: 56px; height: 38px; object-fit: cover; border-radius: 6px; display: block;" />
            </td>
            <td><strong style="color: white;">{{ item.title }}</strong></td>
            <td><span class="cat-pill">{{ item.category_name || 'Comercial' }}</span></td>
            <td>{{ item.sector || '-' }}</td>
            <td>{{ item.area }} m²</td>
            <td><strong style="color: #34d399;">{{ item.price }} €</strong></td>
            <td>
              <span class="status-chip" :class="item.status === 'FREE' ? 'active' : item.status === 'OCCUPIED' ? 'info' : item.status === 'RESERVED' ? 'pending' : 'danger'">
                {{ ST[item.status]?.label || item.status }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="icon-btn" title="Detalii & chiriaș" @click="openDetailsModal(item)"><i class="material-icons" style="font-size:18px">visibility</i></button>
                <button class="icon-btn" title="Vezi pe hartă" @click="openMapModal(item)"><i class="material-icons" style="font-size:18px">map</i></button>
                <button class="icon-btn" title="Editează" @click="openEditModal(item)"><i class="material-icons" style="font-size:18px">edit</i></button>
                <button v-if="isAdmin" class="icon-btn danger" title="Șterge" @click="remove(item.id)"><i class="material-icons" style="font-size:18px">delete</i></button>
              </div>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="8" class="text-center py-4" style="color: #64748b;">Nu există spații adăugate.</td>
          </tr>
        </tbody>
      </table>
    </div>

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
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <n-button v-if="isAdmin && detailsData" type="primary" @click="showDetailsModal = false; openEditModal(detailsData)">
            <template #icon><n-icon><i class="material-icons">edit</i></n-icon></template>
            Editează Spațiul
          </n-button>
          <n-button @click="showDetailsModal = false" style="margin-left: auto;">Închide</n-button>
        </div>
      </template>
    </n-modal>

    <!-- Modal Adăugare Spațiu Comercial Nou -->
    <n-modal v-model:show="showCreateModal" title="Spațiu comercial nou" preset="card" :mask-closable="true" transform-origin="center" style="width: 650px;">
      <n-form-item label="Titlu Anunț">
        <n-input v-model:value="createForm.title" placeholder="Ex: Birou Clasa A - Floreasca" />
      </n-form-item>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <n-form-item label="Categorie">
          <n-select v-model:value="createForm.category_id" :options="categories" placeholder="Selectează categorie" />
        </n-form-item>
        <n-form-item label="Sector">
          <n-select v-model:value="createForm.sector" :options="sectorOpts" placeholder="Alege sector" clearable />
        </n-form-item>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <n-form-item label="Preț lunar">
          <n-input-number v-model:value="createForm.price" :min="0" placeholder="0" style="width: 100%;">
            <template #suffix>EUR</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="Suprafață">
          <n-input-number v-model:value="createForm.area" :min="0" placeholder="0" style="width: 100%;">
            <template #suffix>m²</template>
          </n-input-number>
        </n-form-item>
      </div>

      <n-form-item label="Adresă exactă">
        <n-input v-model:value="createForm.address" placeholder="Strada, Numărul..." />
      </n-form-item>

      <n-form-item label="Imagine principală">
        <div style="width: 100%; border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 14px; text-align: center;">
          <input id="create-modal-file" type="file" @change="handleCreateFileChange" accept="image/*" style="display: none" />
          <n-button @click="triggerCreateFileClick">
            <template #icon><n-icon><i class="material-icons">cloud_upload</i></n-icon></template>
            Alege Imagine
          </n-button>
          <div style="margin-top: 8px; font-size: 0.8rem;">
            <span v-if="createDisplayFileName" style="color: #10b981; font-weight: 600;">
              ✓ {{ createDisplayFileName }}
            </span>
            <span v-else style="color: #64748b;">Nicio imagine selectată</span>
          </div>
        </div>
      </n-form-item>

      <n-form-item label="Descriere detaliată">
        <n-input v-model:value="createForm.description" type="textarea" :rows="3" placeholder="Informații suplimentare despre spațiu..." />
      </n-form-item>

      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <n-button @click="showCreateModal = false">Anulează</n-button>
          <n-button type="primary" :loading="savingCreate" @click="saveCreateProperty">Salvează</n-button>
        </div>
      </template>
    </n-modal>

    <!-- Modal Editare Spațiu Comercial -->
    <n-modal v-model:show="showEditModal" title="Editează spațiul comercial" preset="card" :mask-closable="true" transform-origin="center" style="width: 650px;">
      <n-form-item label="Titlu Anunț">
        <n-input v-model:value="editForm.title" placeholder="Titlu spațiu" />
      </n-form-item>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <n-form-item label="Categorie">
          <n-select v-model:value="editForm.category_id" :options="categories" />
        </n-form-item>
        <n-form-item label="Sector">
          <n-select v-model:value="editForm.sector" :options="sectorOpts" clearable />
        </n-form-item>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <n-form-item label="Preț lunar">
          <n-input-number v-model:value="editForm.price" :min="0" style="width: 100%;">
            <template #suffix>EUR</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="Suprafață">
          <n-input-number v-model:value="editForm.area" :min="0" style="width: 100%;">
            <template #suffix>m²</template>
          </n-input-number>
        </n-form-item>
      </div>

      <n-form-item label="Adresă exactă">
        <n-input v-model:value="editForm.address" />
      </n-form-item>

      <n-form-item label="Imagini atașate spațiului (Galerie)">
        <div style="width: 100%;">
          <!-- Galerie poze existente -->
          <div v-if="editForm.images && editForm.images.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; margin-bottom: 14px;">
            <div 
              v-for="img in editForm.images" 
              :key="img.id"
              style="position: relative; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); aspect-ratio: 4/3; background: #111;"
            >
              <img 
                :src="getImageUrl(img.path || img.image_path)" 
                style="width: 100%; height: 100%; object-fit: cover;" 
              />
              <button 
                type="button"
                @click.prevent="deleteEditImage(img.id)"
                title="Șterge imaginea"
                style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 6px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2;"
              >
                <i class="material-icons" style="font-size: 16px;">delete</i>
              </button>
            </div>
          </div>
          <div v-else style="color: #64748b; font-size: 0.85rem; margin-bottom: 12px;">
            Nu există imagini salvate momentan pentru acest spațiu.
          </div>

          <!-- Buton încărcare poză nouă -->
          <div style="border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 14px; text-align: center; background: rgba(255,255,255,0.02);">
            <input id="edit-modal-file-list" type="file" @change="handleEditFileChange" accept="image/*" style="display: none" />
            <n-button type="primary" secondary @click="triggerEditFileClick" :loading="uploadingEditImage">
              <template #icon><n-icon><i class="material-icons">add_photo_alternate</i></n-icon></template>
              Încarcă Poză Nouă
            </n-button>
            <div style="margin-top: 8px; font-size: 0.8rem; color: #64748b;">
              Imaginea selectată va fi încărcată și adăugată instant în galeria spațiului
            </div>
          </div>
        </div>
      </n-form-item>

      <n-form-item label="Stare Curentă">
        <n-select v-model:value="editForm.status" :options="statusOptions" />
      </n-form-item>

      <n-form-item label="Descriere detaliată">
        <n-input v-model:value="editForm.description" type="textarea" :rows="3" />
      </n-form-item>

      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <n-button @click="showEditModal = false">Anulează</n-button>
          <n-button type="primary" :loading="savingEdit" @click="saveEditProperty">Salvează Modificările</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useMessage, useDialog, NCard, NDataTable, NButton, NInput, NInputNumber, NSelect, NModal, NTag, NSpin, NIcon, NFormItem, NDivider } from 'naive-ui';
import api from '../services/api';
import { SPACE_STATUS } from '../services/labels';
import PropertyMap from '../components/PropertyMap.vue';

export default {
  name: 'Properties',
  components: { NCard, NDataTable, NButton, NInput, NInputNumber, NSelect, NModal, NTag, NSpin, NIcon, NFormItem, NDivider, PropertyMap },
  setup() {
    const store = useStore();
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();
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

    // Date categorii și sectoare
    const categories = [
      { id: 1, value: 1, label: "Birouri", name: "Birouri" },
      { id: 2, value: 2, label: "Comercial / Retail", name: "Comercial / Retail" },
      { id: 3, value: 3, label: "Industrial / Hale", name: "Industrial / Hale" },
      { id: 4, value: 4, label: "Terenuri", name: "Terenuri" },
    ];
    const sectorOpts = [
      { value: "Sector 1", label: "Sector 1" }, { value: "Sector 2", label: "Sector 2" },
      { value: "Sector 3", label: "Sector 3" }, { value: "Sector 4", label: "Sector 4" },
      { value: "Sector 5", label: "Sector 5" }, { value: "Sector 6", label: "Sector 6" },
    ];

    // Stări Modal Spațiu Nou
    const showCreateModal = ref(false);
    const savingCreate = ref(false);
    const createFile = ref(null);
    const createDisplayFileName = ref("");
    const createForm = reactive({
      title: "", category_id: null, price: null, area: null,
      address: "", sector: null, description: ""
    });

    // Stări Modal Editare Spațiu
    const showEditModal = ref(false);
    const savingEdit = ref(false);
    const uploadingEditImage = ref(false);
    const editFile = ref(null);
    const editDisplayFileName = ref("");
    const editForm = reactive({
      id: null, title: "", category_id: null, price: null, area: null,
      address: "", sector: null, description: "", status: "FREE", images: []
    });

    const triggerEditFileClick = () => {
      document.getElementById("edit-modal-file-list")?.click();
    };

    const handleEditFileChange = async (event) => {
      const file = event.target.files?.[0];
      if (!file || !editForm.id) return;
      uploadingEditImage.value = true;
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await api.post(`/properties/${editForm.id}/images`, formData, { headers: { "Content-Type": undefined } });
        if (!editForm.images) editForm.images = [];
        editForm.images.push(res.data);
        message.success("Imagine încărcată și adăugată în galerie!");
        await load();
      } catch (err) {
        message.error("Eroare la încărcarea imaginii.");
      } finally {
        uploadingEditImage.value = false;
        event.target.value = '';
      }
    };

    const deleteEditImage = (imageId) => {
      dialog.warning({
        title: 'Ștergere Imagine',
        content: 'Sigur dorești să ștergi această imagine din galeria spațiului?',
        positiveText: 'Da, șterge',
        negativeText: 'Anulează',
        onPositiveClick: async () => {
          try {
            await api.delete(`/properties/${editForm.id}/images/${imageId}`);
            editForm.images = editForm.images.filter(img => img.id !== imageId);
            message.success("Imagine ștearsă din galerie!");
            await load();
          } catch (err) {
            message.error("Eroare la ștergerea imaginii.");
          }
        }
      });
    };

    const triggerCreateFileClick = () => {
      document.getElementById("create-modal-file")?.click();
    };

    const handleCreateFileChange = (event) => {
      if (event.target.files && event.target.files[0]) {
        createFile.value = event.target.files[0];
        createDisplayFileName.value = event.target.files[0].name;
      }
    };

    const openCreateModal = () => {
      createForm.title = "";
      createForm.category_id = null;
      createForm.price = null;
      createForm.area = null;
      createForm.address = "";
      createForm.sector = null;
      createForm.description = "";
      createFile.value = null;
      createDisplayFileName.value = "";
      showCreateModal.value = true;
    };

    const saveCreateProperty = async () => {
      if (!createForm.title || !createForm.category_id || !createForm.price || !createForm.area || !createForm.address) {
        message.warning("Verifică formularul! Toate câmpurile obligatorii trebuie completate.");
        return;
      }
      if (!createFile.value) {
        message.warning("Selectează o imagine pentru spațiu!");
        return;
      }
      savingCreate.value = true;
      try {
        const formData = new FormData();
        formData.append("title", createForm.title);
        formData.append("description", createForm.description || "");
        formData.append("price", createForm.price);
        formData.append("area", createForm.area);
        formData.append("address", createForm.address);
        formData.append("sector", createForm.sector || "");
        formData.append("category_id", createForm.category_id);
        formData.append("image", createFile.value);
        await api.post("/properties", formData, { headers: { "Content-Type": undefined } });
        message.success("Spațiu comercial adăugat cu succes!");
        showCreateModal.value = false;
        await load();
      } catch (err) {
        console.error(err);
        message.error(err.response?.data?.message || "Eroare la adăugarea spațiului.");
      } finally {
        savingCreate.value = false;
      }
    };

    const openEditModal = async (prop) => {
      editForm.id = prop.id;
      editForm.title = prop.title || "";
      editForm.category_id = prop.category_id || null;
      editForm.price = prop.price !== null && prop.price !== undefined ? Number(prop.price) : null;
      editForm.area = prop.area !== null && prop.area !== undefined ? Number(prop.area) : null;
      editForm.address = prop.address || "";
      editForm.sector = prop.sector || null;
      editForm.description = prop.description || "";
      editForm.status = prop.status || "FREE";
      editFile.value = null;
      editDisplayFileName.value = "";
      try {
        const res = await api.get(`/properties/${prop.id}`);
        editForm.images = res.data?.images || [];
      } catch (e) {
        editForm.images = prop.image_path ? [{ id: 'main', path: prop.image_path }] : [];
      }
      showEditModal.value = true;
    };

    const saveEditProperty = async () => {
      if (!editForm.title || !editForm.category_id || !editForm.price || !editForm.area || !editForm.address) {
        message.warning("Verifică formularul! Toate câmpurile obligatorii trebuie completate.");
        return;
      }
      savingEdit.value = true;
      try {
        await api.put(`/properties/${editForm.id}`, {
          title: editForm.title,
          description: editForm.description || "",
          price: editForm.price,
          area: editForm.area,
          address: editForm.address,
          sector: editForm.sector || "",
          category_id: editForm.category_id,
          status: editForm.status
        });
        if (editFile.value) {
          const formData = new FormData();
          formData.append("image", editFile.value);
          await api.post(`/properties/${editForm.id}/images`, formData, { headers: { "Content-Type": undefined } });
        }
        message.success("Spațiu comercial actualizat cu succes!");
        showEditModal.value = false;
        await load();
      } catch (err) {
        console.error(err);
        message.error("Eroare la actualizarea spațiului.");
      } finally {
        savingEdit.value = false;
      }
    };

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
      ST[key] = { label: val.label, naiveType: statusTypeMap[key] || 'default' };
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
          h(NButton, { text: true, type: 'primary', onClick: () => openEditModal(row), title: 'Editează spațiu' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'edit') }) }),
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
    const remove = (id) => {
      dialog.warning({
        title: 'Confirmare Ștergere Spațiu',
        content: 'Ești sigur că dorești să ștergi definitiv acest spațiu comercial? Această acțiune nu poate fi anulată.',
        positiveText: 'Da, șterge definitiv',
        negativeText: 'Anulează',
        onPositiveClick: async () => {
          try {
            await api.delete(`/properties/${id}`);
            message.success('Spațiu șters cu succes.');
            load();
          } catch (e) {
            message.error('Eroare la ștergere.');
          }
        }
      });
    };
    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=Spatiu';
      const strPath = typeof path === 'string' ? path : (path.path || String(path));
      if (!strPath) return 'https://placehold.co/400x300?text=Spatiu';
      return `http://localhost:3000/${strPath.replace(/\\/g, '/')}`;
    };
    const goToAddProperty = () => {
      openCreateModal();
    };
    const goToEditProperty = (id) => {
      const prop = items.value.find(x => x.id === id);
      if (prop) openEditModal(prop);
    };
    onMounted(load);
    return { 
      items, loading, search, statusFilter, statusOptions, columns, ST, isAdmin, 
      showMapModal, selectedProperty, openMapModal, 
      showDetailsModal, loadingDetails, detailsData, detailsImgIdx, openDetailsModal, formatDate,
      load, remove, getImageUrl, goToAddProperty, goToEditProperty,
      categories, sectorOpts,
      showCreateModal, savingCreate, createForm, createFile, createDisplayFileName,
      triggerCreateFileClick, handleCreateFileChange, openCreateModal, saveCreateProperty,
      showEditModal, savingEdit, editForm, openEditModal, saveEditProperty,
      editFile, editDisplayFileName, triggerEditFileClick, handleEditFileChange,
      uploadingEditImage, deleteEditImage
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
