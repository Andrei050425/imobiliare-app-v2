<template>
  <div class="property-details-container">
    <div v-if="loading" class="text-center mt-5" style="padding: 40px; display: flex; justify-content: center;">
      <n-spin size="large" />
    </div>

  <div v-else-if="!property" class="text-center mt-5" style="padding: 40px; text-align: center;">
    <h3>Anunțul nu a fost găsit.</h3>
    <n-button @click="$router.push('/')" style="margin-top: 12px;">Înapoi la oferte</n-button>
  </div>

  <div v-else class="row justify-center pb-4" style="max-width: 1200px; margin: 0 auto;">
    <div style="width: 100%;">
      <n-button secondary @click="$router.back()" style="margin-bottom: 16px;">
        <template #icon><n-icon><i class="material-icons">arrow_back</i></n-icon></template>
        Înapoi
      </n-button>

      <n-card :bordered="true" content-style="padding: 0;">
        <!-- GALERIE FOTO INTERACTIVĂ -->
        <div class="property-gallery-wrapper">
          <div class="main-image-container">
            <img 
              :src="getImageUrl(property.images?.[currentImgIdx || 0]?.path)" 
              class="main-gallery-img"
              alt="Imagine proprietate"
            />
            
            <div v-if="property.images && property.images.length > 1" class="gallery-nav-arrows">
              <button class="nav-arrow left-arrow" @click.stop="prevImg" title="Imaginea anterioară">
                <i class="material-icons">chevron_left</i>
              </button>
              <button class="nav-arrow right-arrow" @click.stop="nextImg" title="Imaginea următoare">
                <i class="material-icons">chevron_right</i>
              </button>
            </div>

            <div v-if="property.images && property.images.length > 1" class="gallery-counter">
              <i class="material-icons" style="font-size: 16px; margin-right: 4px;">photo_camera</i>
              <span>{{ (currentImgIdx || 0) + 1 }} / {{ property.images.length }}</span>
            </div>
          </div>

          <div v-if="property.images && property.images.length > 1" class="thumbnails-strip">
            <div 
              v-for="(img, idx) in property.images" 
              :key="img.id || idx"
              class="thumb-item"
              :class="{ 'active-thumb': idx === (currentImgIdx || 0) }"
              @click="currentImgIdx = idx"
            >
              <img :src="getImageUrl(img.path)" class="thumb-img" />
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          <div class="row" style="display: flex; flex-wrap: wrap; gap: 24px;">
            <div style="flex: 1; min-width: 300px;">
              <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px; color: #f1f5f9;">{{ property.title }}</h1>
              
              <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                 <n-tag type="info">{{ property.category_name }}</n-tag>
                 <span style="color: #94a3b8; display: flex; align-items: center; gap: 4px;">
                   <i class="material-icons" style="font-size: 18px;">location_on</i> {{ property.address }}
                 </span>
              </div>

              <h3 style="margin-top: 24px; font-size: 1.3rem; color: #f1f5f9;">Descriere</h3>
              <p style="white-space: pre-line; color: #cbd5e1; line-height: 1.6;">{{ property.description }}</p>

              <!-- Harta de Localizare -->
              <div v-if="property.latitude && property.longitude" style="margin-top: 32px;">
                <h3 style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: #f1f5f9;">
                  <i class="material-icons" style="color: #6366f1;">map</i> Localizare pe hartă
                </h3>
                <div style="height: 380px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
                  <PropertyMap :properties="[property]" :simple-pin="true" />
                </div>
              </div>
            </div>

            <div style="width: 320px; flex-shrink: 0;">
              <n-card :bordered="true" style="background: rgba(255, 255, 255, 0.03);">
                <div style="font-size: 1.8rem; font-weight: 800; color: #6366f1; text-align: center; margin-bottom: 16px;">
                  {{ property.price }} EUR <span style="font-size: 0.9rem; font-weight: normal; color: #94a3b8;">/ lună</span>
                </div>
                
                <n-divider />
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                  <div style="text-align: center;">
                    <i class="material-icons" style="font-size: 24px; color: #94a3b8;">square_foot</i>
                    <div style="font-weight: bold; color: #f1f5f9; margin-top: 4px;">{{ property.area }} mp</div>
                  </div>
                  <div style="text-align: center;">
                    <i class="material-icons" style="font-size: 24px; color: #94a3b8;">person</i>
                    <div style="color: #f1f5f9; margin-top: 4px;">{{ property.owner_name || 'Proprietar' }}</div>
                  </div>
                </div>

                <div style="margin-top: 24px;" v-if="isAdmin">
                  <n-button block type="primary" @click="openEditModal">
                    <template #icon><n-icon><i class="material-icons">edit</i></n-icon></template>
                    Editează Spațiul
                  </n-button>
                </div>
                <div style="margin-top: 24px;" v-else-if="property.status === 'FREE'">
                  <div v-if="myActiveOffer" style="text-align: left;">
                    <n-alert type="success" :bordered="true" title="Ofertă trimisă" style="margin-bottom: 16px;">
                      Ai trimis deja o ofertă pentru acest spațiu, aflată în curs de evaluare.
                    </n-alert>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      <n-button block type="primary" secondary @click="$router.push('/app/my-offers')">
                        <template #icon><n-icon><i class="material-icons">visibility</i></n-icon></template>
                        Vezi în „Ofertele mele”
                      </n-button>
                      <n-button block type="warning" secondary @click="showDuplicateOfferModal = true">
                        <template #icon><n-icon><i class="material-icons">add_circle_outline</i></n-icon></template>
                        Trimite o altă ofertă
                      </n-button>
                    </div>
                  </div>
                  <n-button v-else block type="primary" @click="openOfferModal">
                    <template #icon><n-icon><i class="material-icons">send</i></n-icon></template>
                    Trimite ofertă
                  </n-button>
                </div>
                <div style="margin-top: 24px;" v-else-if="isMyRentedSpace">
                  <n-alert type="success" :bordered="true">
                    Spațiu închiriat de tine
                  </n-alert>
                </div>
                <div style="margin-top: 24px;" v-else>
                  <n-alert type="info" :bordered="true">
                    Acest spațiu nu mai este disponibil pentru închiriere.
                  </n-alert>
                </div>
              </n-card>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <!-- MODAL TRIMITE OFERTĂ -->
    <n-modal v-model:show="showOfferModal" title="Trimite Ofertă de Închiriere" preset="card" style="width: 520px;">
      <div v-if="property" style="padding: 8px 0;">
        <div style="margin-bottom: 16px; padding: 12px; border-radius: 8px; background: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1;">
          <div style="font-weight: bold; color: #f1f5f9;">{{ property.title }}</div>
          <div style="color: #94a3b8; font-size: 0.9rem;">Preț catalog: <strong style="color: #10b981;">{{ property.price }} EUR / lună</strong></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Data început contract</label>
            <n-input v-model:value="offerForm.start_date" type="date" />
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Data sfârșit contract</label>
            <n-input v-model:value="offerForm.end_date" type="date" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Contraofertă Chirie Lunară (EUR)</label>
            <n-input-number v-model:value="offerForm.price" :min="0" style="width: 100%;">
              <template #suffix>EUR</template>
            </n-input-number>
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Garanție propusă (EUR)</label>
            <n-input-number v-model:value="offerForm.deposit_eur" :min="0" :disabled="true" :show-button="false" style="width: 100%;">
              <template #suffix>EUR</template>
            </n-input-number>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Mesaj / Observații suplimentare (opțional)</label>
          <n-input 
            v-model:value="offerForm.details" 
            type="textarea" 
            :rows="3" 
            placeholder="Menționează orice cerință specială sau detaliu despre oferta ta..."
          />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
          <n-button secondary @click="showOfferModal = false">Anulează</n-button>
          <n-button type="primary" :loading="sendingOffer" @click="submitOffer">
            <template #icon><n-icon><i class="material-icons">send</i></n-icon></template>
            Trimite Oferta
          </n-button>
        </div>
      </div>
    </n-modal>

    <!-- MODAL AVERTIZARE OFERTĂ EXISTENTĂ -->
    <n-modal v-model:show="showDuplicateOfferModal" preset="card" style="width: 460px; background: #1e1e2e; border: 1px solid rgba(245, 158, 11, 0.4);">
      <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 16px; display: flex; gap: 12px; align-items: flex-start;">
        <i class="material-icons" style="color: #f59e0b; font-size: 24px; flex-shrink: 0; margin-top: 2px;">error</i>
        <div style="color: #fdd835; font-size: 0.98rem; line-height: 1.5; font-weight: 500;">
          Ai deja o ofertă trimisă pentru acest spațiu. Nu mai poți trimite alta până nu o anulezi pe cea transmisă anterior.
        </div>
      </div>
      <n-button block type="warning" secondary style="background: rgba(245, 158, 11, 0.1); border-color: #f59e0b; color: #f59e0b; font-weight: 600; height: 44px; font-size: 1rem;" @click="showDuplicateOfferModal = false; $router.push('/app/my-offers')">
        <template #icon><n-icon><i class="material-icons">visibility</i></n-icon></template>
        Vezi în „Ofertele mele”
      </n-button>
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
            <input id="edit-modal-file" type="file" @change="handleEditFileChange" accept="image/*" style="display: none" />
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
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useMessage, useDialog, NCard, NButton, NIcon, NSpin, NTag, NDivider, NAlert, NModal, NInput, NInputNumber, NSelect, NFormItem } from 'naive-ui';
import api from '../services/api';
import { SPACE_STATUS } from '../services/labels';
import PropertyMap from '../components/PropertyMap.vue';

export default {
  name: 'PropertyDetails',
  components: { NCard, NButton, NIcon, NSpin, NTag, NDivider, NAlert, NModal, NInput, NInputNumber, NSelect, NFormItem, PropertyMap },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const message = useMessage();
    const dialog = useDialog();
    
    const isAdmin = computed(() => store.getters.isAdmin);
    const property = ref(null);
    const loading = ref(true);
    const currentImgIdx = ref(0);
    const myRentedPropertyIds = ref([]);
    const myActiveOffer = ref(null);

    const nextImg = () => {
      if (!property.value?.images?.length) return;
      currentImgIdx.value = (currentImgIdx.value + 1) % property.value.images.length;
    };

    const prevImg = () => {
      if (!property.value?.images?.length) return;
      currentImgIdx.value = (currentImgIdx.value - 1 + property.value.images.length) % property.value.images.length;
    };

    const fetchProperty = async () => {
      try {
        currentImgIdx.value = 0;
        const id = route.params.id;
        const res = await api.get(`/properties/${id}`);
        property.value = res.data;
        if (store.getters.isLoggedIn) {
          try {
            const offersRes = await api.get('/offers/mine');
            myActiveOffer.value = offersRes.data.find(o => Number(o.property_id) === Number(property.value.id) && ['PENDING', 'SENT'].includes(o.status));
          } catch (e) {
            console.error(e);
          }
          if (store.getters.userRole === 'client') {
            try {
              const mineRes = await api.get('/contracts/mine');
              myRentedPropertyIds.value = mineRes.data.map(c => Number(c.property_id));
            } catch (e) {
              console.error(e);
            }
          }
        }
      } catch (err) {
        console.error(err);
        message.error('Nu am putut încărca anunțul');
      } finally {
        loading.value = false;
      }
    };

    const getImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/600x400?text=Fara+Poza';
      const cleanPath = path.replace(/\\/g, "/");
      return `http://localhost:3000/${cleanPath}`; 
    };

    const showOfferModal = ref(false);
    const showDuplicateOfferModal = ref(false);
    const sendingOffer = ref(false);
    const offerForm = ref({
      start_date: '',
      end_date: '',
      price: 0,
      deposit_eur: 0,
      details: ''
    });

    watch(() => offerForm.value.start_date, (newDate) => {
      if (newDate) {
        const dateObj = new Date(newDate);
        if (!isNaN(dateObj.getTime())) {
          dateObj.setFullYear(dateObj.getFullYear() + 1);
          offerForm.value.end_date = dateObj.toISOString().split('T')[0];
        }
      }
    });

    watch(() => offerForm.value.price, (newPrice) => {
      if (newPrice !== undefined && newPrice !== null) {
        offerForm.value.deposit_eur = Number(newPrice) * 2;
      }
    });

    const openOfferModal = () => {
      if (!store.getters.isLoggedIn) {
        message.warning('Trebuie să te loghezi pentru a trimite o ofertă.');
        router.push('/login');
        return;
      }
      if (myActiveOffer.value) {
        showDuplicateOfferModal.value = true;
        return;
      }
      
      const today = new Date();
      const startDateStr = today.toISOString().split('T')[0];
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const endDateStr = nextYear.toISOString().split('T')[0];

      const defaultPrice = property.value?.price || 0;
      offerForm.value = {
        start_date: startDateStr,
        end_date: endDateStr,
        price: defaultPrice,
        deposit_eur: defaultPrice * 2,
        details: ''
      };
      showOfferModal.value = true;
    };

    const submitOffer = async () => {
      if (!offerForm.value.start_date || !offerForm.value.end_date) {
        message.warning('Te rugăm să selectezi perioada de valabilitate a contractului.');
        return;
      }
      if (!offerForm.value.price || offerForm.value.price <= 0) {
        message.warning('Te rugăm să introduci o chirie lunară validă.');
        return;
      }

      sendingOffer.value = true;
      try {
        const detailsObj = {
          start_date: offerForm.value.start_date,
          end_date: offerForm.value.end_date,
          deposit_eur: Number(offerForm.value.deposit_eur || 0),
          message: offerForm.value.details
        };

        await api.post('/offers', { 
          property_id: route.params.id,
          offer_price: Number(offerForm.value.price),
          offer_details: JSON.stringify(detailsObj)
        });
        
        message.success('Oferta ta a fost trimisă cu succes către administrator!');
        showOfferModal.value = false;
        fetchProperty();
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message;
        message.error(`A apărut o eroare: ${msg}`);
      } finally {
        sendingOffer.value = false;
      }
    };

    const isMyRentedSpace = computed(() => {
      if (!store.getters.isLoggedIn || !property.value) return false;
      const user = store.getters.currentUser;
      if (!user) return false;

      if (myRentedPropertyIds.value.includes(Number(property.value.id))) {
        return true;
      }

      if (property.value.tenant) {
        if (property.value.tenant.tenant_email && user.email && property.value.tenant.tenant_email.toLowerCase() === user.email.toLowerCase()) {
          return true;
        }
        if (property.value.tenant.tenant_user_id && Number(property.value.tenant.tenant_user_id) === Number(user.id)) {
          return true;
        }
        if (property.value.tenant.user_id && Number(property.value.tenant.user_id) === Number(user.id)) {
          return true;
        }
      }
      return false;
    });

    // State și opțiuni pentru editare spațiu
    // State și opțiuni pentru editare spațiu
    const showEditModal = ref(false);
    const savingEdit = ref(false);
    const uploadingEditImage = ref(false);
    const editFile = ref(null);
    const editDisplayFileName = ref("");
    const editForm = reactive({
      title: "", category_id: null, price: null, area: null,
      address: "", sector: null, description: "", status: "FREE", images: []
    });

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

    const statusOptions = Object.entries(SPACE_STATUS).map(([value, v]) => ({ value, label: v.label }));

    const triggerEditFileClick = () => {
      document.getElementById("edit-modal-file")?.click();
    };

    const handleEditFileChange = async (event) => {
      const file = event.target.files?.[0];
      if (!file || !property.value) return;
      uploadingEditImage.value = true;
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await api.post(`/properties/${property.value.id}/images`, formData, { headers: { "Content-Type": undefined } });
        if (!editForm.images) editForm.images = [];
        editForm.images.push(res.data);
        message.success("Imagine încărcată și adăugată cu succes!");
        await fetchProperty();
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
            await api.delete(`/properties/${property.value.id}/images/${imageId}`);
            editForm.images = editForm.images.filter(img => img.id !== imageId);
            message.success("Imagine ștearsă cu succes!");
            await fetchProperty();
          } catch (err) {
            message.error("Eroare la ștergerea imaginii.");
          }
        }
      });
    };

    const openEditModal = async () => {
      if (!property.value) return;
      editForm.title = property.value.title || "";
      editForm.category_id = property.value.category_id || null;
      editForm.price = property.value.price || 0;
      editForm.area = property.value.area || 0;
      editForm.address = property.value.address || "";
      editForm.sector = property.value.sector || null;
      editForm.description = property.value.description || "";
      editForm.status = property.value.status || "FREE";
      editFile.value = null;
      editDisplayFileName.value = "";
      try {
        const res = await api.get(`/properties/${property.value.id}`);
        property.value = res.data;
        editForm.images = res.data?.images || [];
      } catch (e) {
        editForm.images = [...(property.value.images || [])];
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
        await api.put(`/properties/${property.value.id}`, editForm);
        message.success("Spațiu comercial actualizat cu succes!");
        showEditModal.value = false;
        await fetchProperty();
      } catch (e) {
        message.error(e.response?.data?.error || "Eroare la actualizarea spațiului.");
      } finally {
        savingEdit.value = false;
      }
    };

    onMounted(fetchProperty);

    return { 
      property, loading, getImageUrl, isAdmin, currentImgIdx, nextImg, prevImg, isMyRentedSpace,
      showOfferModal, showDuplicateOfferModal, sendingOffer, offerForm, openOfferModal, submitOffer, myActiveOffer,
      showEditModal, savingEdit, editForm, categories, sectorOpts, statusOptions, openEditModal, saveEditProperty,
      editFile, editDisplayFileName, triggerEditFileClick, handleEditFileChange,
      uploadingEditImage, deleteEditImage
    };
  }
};
</script>

<style scoped>
.property-gallery-wrapper {
  position: relative;
  background: #18181c;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}
.main-image-container {
  position: relative;
  width: 100%;
  height: 440px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
}
.main-gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gallery-nav-arrows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  pointer-events: none;
}
.nav-arrow {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(30, 30, 46, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  color: #f1f5f9;
}
.nav-arrow:hover {
  background: #6366f1;
  border-color: #6366f1;
  transform: scale(1.1);
}
.gallery-counter {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.thumbnails-strip {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #1e1e2e;
  overflow-x: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.thumb-item {
  width: 96px;
  height: 68px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.65;
  transition: all 0.2s ease;
  flex-shrink: 0;
  border: 2px solid transparent;
}
.thumb-item:hover {
  opacity: 0.95;
}
.thumb-item.active-thumb {
  opacity: 1;
  border-color: #6366f1;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>