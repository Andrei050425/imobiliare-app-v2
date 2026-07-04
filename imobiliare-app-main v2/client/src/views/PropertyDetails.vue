<template>
  <div v-if="loading" class="text-center mt-5">
    <va-progress-circle indeterminate />
  </div>

  <div v-else-if="!property" class="text-center mt-5">
    <h3>Anunțul nu a fost găsit.</h3>
    <va-button to="/">Înapoi la oferte</va-button>
  </div>

  <div v-else class="row justify-center pb-4">
    <div class="flex xs12 lg10">
      <va-button preset="secondary" icon="arrow_back" @click="$router.back()" class="mb-3">
        Înapoi
      </va-button>

      <va-card>
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
                <va-icon name="chevron_left" />
              </button>
              <button class="nav-arrow right-arrow" @click.stop="nextImg" title="Imaginea următoare">
                <va-icon name="chevron_right" />
              </button>
            </div>

            <div v-if="property.images && property.images.length > 1" class="gallery-counter">
              <va-icon name="photo_camera" size="small" class="mr-1" />
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

        <va-card-content>
          <div class="row">
            <div class="flex xs12 md8">
              <h1 class="display-2 mb-2">{{ property.title }}</h1>
              
              <div class="mb-4">
                 <va-chip color="info" class="mr-2">{{ property.category_name }}</va-chip>
                 <span class="text--secondary"><va-icon name="location_on" size="small"/> {{ property.address }}</span>
              </div>

              <h3 class="mt-4">Descriere</h3>
              <p style="white-space: pre-line;">{{ property.description }}</p>

              <!-- Harta de Localizare -->
              <div v-if="property.latitude && property.longitude" class="mt-5">
                <h3 class="mb-3 d-flex align-center gap-2">
                  <va-icon name="map" color="primary" /> Localizare pe hartă
                </h3>
                <div style="height: 380px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                  <PropertyMap :properties="[property]" :simple-pin="true" />
                </div>
              </div>
            </div>

            <div class="flex xs12 md4">
              <va-card color="background-element" class="mt-3 md-mt-0">
                <va-card-content>
                  <div class="display-6 text-primary mb-3 text-center">
                    {{ property.price }} EUR
                  </div>
                  
                  <va-divider />
                  
                  <div class="row mt-3">
                    <div class="flex xs6 text-center">
                      <va-icon name="square_foot" color="secondary" />
                      <div class="text--bold">{{ property.area }} mp</div>
                    </div>
                    <div class="flex xs6 text-center">
                      <va-icon name="person" color="secondary" />
                      <div>{{ property.owner_name || 'Proprietar' }}</div>
                    </div>
                  </div>

                  <div class="mt-4" v-if="isAdmin">
                    <va-button block color="primary" icon="edit" @click="$router.push(`/app/properties/edit/${property.id}`)">
                      Editează Spațiul
                    </va-button>
                  </div>
                  <div class="mt-4" v-else-if="property.status === 'FREE'">
                    <div v-if="myActiveOffer" class="text-center">
                      <va-alert color="warning" outline class="text-center w-full mb-3 text-sm">
                        <va-icon name="info" class="mr-1" />
                        Ai deja o ofertă trimisă pentru acest spațiu. Odată ce a fost trimisă oferta nu mai poți trimite alta până nu o anulezi pe cea transmisă înainte.
                      </va-alert>
                      <va-button block color="warning" preset="secondary" icon="visibility" @click="$router.push('/app/my-offers')">
                        Vezi / Anulează în „Ofertele mele”
                      </va-button>
                    </div>
                    <va-button v-else block color="primary" icon="send" @click="openOfferModal">
                      Trimite ofertă
                    </va-button>
                  </div>
                  <div class="mt-4" v-else-if="isMyRentedSpace">
                    <va-alert color="success" outline class="text-center w-full">
                      <va-icon name="check_circle" class="mr-1" />
                      Spațiu închiriat de tine
                    </va-alert>
                  </div>
                  <div class="mt-4" v-else>
                    <va-alert color="info" outline class="text-center w-full">
                      Acest spațiu nu mai este disponibil pentru închiriere.
                    </va-alert>
                  </div>
                </va-card-content>
              </va-card>
            </div>
          </div>
        </va-card-content>
      </va-card>
    </div>

    <!-- MODAL TRIMITE OFERTĂ -->
    <va-modal v-model="showOfferModal" title="Trimite Ofertă de Închiriere" hide-default-actions>
      <div v-if="property" class="modal-form py-2" style="min-width: 320px; max-width: 520px;">
        <div class="mb-3 p-3 rounded" style="background-color: var(--va-background-element); border-left: 4px solid var(--va-primary);">
          <div class="text--bold">{{ property.title }}</div>
          <div class="text--secondary text-sm">Preț catalog: <strong>{{ property.price }} EUR / lună</strong></div>
        </div>

        <div class="row mb-3">
          <div class="flex xs12 sm6 pr-sm-2 mb-2 sm-mb-0">
            <va-input 
              v-model="offerForm.start_date" 
              type="date" 
              label="Data început contract" 
              bordered
            />
          </div>
          <div class="flex xs12 sm6 pl-sm-2">
            <va-input 
              v-model="offerForm.end_date" 
              type="date" 
              label="Data sfârșit (alegi câți ani dorești)" 
              bordered
            />
          </div>
        </div>

        <div class="mb-3">
          <va-input 
            v-model.number="offerForm.price" 
            type="number" 
            label="Contraofertă Chirie Lunară (EUR)" 
            bordered
          >
            <template #prependInner>
              <va-icon name="euro" size="small" color="secondary" />
            </template>
          </va-input>
        </div>

        <div class="mb-4">
          <va-input 
            v-model="offerForm.details" 
            type="textarea" 
            label="Mesaj / Observații suplimentare (opțional)" 
            :min-rows="3" 
            bordered 
            placeholder="Menționează orice cerință specială sau detaliu despre oferta ta..."
          />
        </div>

        <div class="d-flex justify-end gap-2 mt-4">
          <va-button preset="secondary" color="secondary" @click="showOfferModal = false">
            Anulează
          </va-button>
          <va-button color="primary" icon="send" :loading="sendingOffer" @click="submitOffer">
            Trimite Oferta
          </va-button>
        </div>
      </div>
    </va-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'vuestic-ui';
import api from '../services/api';
import PropertyMap from '../components/PropertyMap.vue';

export default {
  components: { PropertyMap },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const { init: notify } = useToast();
    
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
        // Luam ID-ul din URL (ex: /property/5)
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
        notify({ message: 'Nu am putut încărca anunțul', color: 'danger' });
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
    const sendingOffer = ref(false);
    const offerForm = ref({
      start_date: '',
      end_date: '',
      price: 0,
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

    const openOfferModal = () => {
      if (!store.getters.isLoggedIn) {
        notify({ message: 'Trebuie să te loghezi pentru a trimite o ofertă.', color: 'warning' });
        router.push('/login');
        return;
      }
      
      const today = new Date();
      const startDateStr = today.toISOString().split('T')[0];
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const endDateStr = nextYear.toISOString().split('T')[0];

      offerForm.value = {
        start_date: startDateStr,
        end_date: endDateStr,
        price: property.value?.price || 0,
        details: ''
      };
      showOfferModal.value = true;
    };

    const submitOffer = async () => {
      if (!offerForm.value.start_date || !offerForm.value.end_date) {
        notify({ message: 'Te rugăm să selectezi perioada de valabilitate a contractului.', color: 'warning' });
        return;
      }
      if (!offerForm.value.price || offerForm.value.price <= 0) {
        notify({ message: 'Te rugăm să introduci o chirie lunară validă.', color: 'warning' });
        return;
      }

      sendingOffer.value = true;
      try {
        const detailsObj = {
          start_date: offerForm.value.start_date,
          end_date: offerForm.value.end_date,
          message: offerForm.value.details
        };

        await api.post('/offers', { 
          property_id: route.params.id,
          offer_price: Number(offerForm.value.price),
          offer_details: JSON.stringify(detailsObj)
        });
        
        notify({ message: 'Oferta ta a fost trimisă cu succes către administrator!', color: 'success' });
        showOfferModal.value = false;
        fetchProperty();
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message;
        notify({ message: `A apărut o eroare: ${msg}`, color: 'danger' });
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

    onMounted(fetchProperty);

    return { 
      property, loading, getImageUrl, isAdmin, currentImgIdx, nextImg, prevImg, isMyRentedSpace,
      showOfferModal, sendingOffer, offerForm, openOfferModal, submitOffer, myActiveOffer
    };
  }
}
</script>

<style scoped>
.property-gallery-wrapper {
  position: relative;
  background: #ffffff;
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
  background: rgba(255, 255, 255, 0.85);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  color: #1e293b;
}
.nav-arrow:hover {
  background: #ffffff;
  transform: scale(1.1);
}
.gallery-counter {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(15, 23, 42, 0.8);
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
  background: #f8fafc;
  overflow-x: auto;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
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
  border: 2px solid #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.thumb-item:hover {
  opacity: 0.95;
  border-color: #94a3b8;
}
.thumb-item.active-thumb {
  opacity: 1;
  border-color: #2563eb;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>