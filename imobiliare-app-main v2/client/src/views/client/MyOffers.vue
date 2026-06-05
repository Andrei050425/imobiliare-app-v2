<template>
  <div>
    <div class="page-title">Ofertele mele</div>

    <va-card>
      <va-card-content>
        <div v-if="loading" class="text-center"><va-progress-circle indeterminate /></div>
        
        <va-data-table v-else :items="offers" :columns="cols" no-data-html="Nu ai nicio cerere sau ofertă.">
          <template #cell(image)="{ row }">
            <img :src="getImageUrl(row.source.image_path)" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; display: block;" />
          </template>
          <template #cell(status)="{ value }">
            <va-badge 
              :color="value === 'PENDING' ? 'warning' : (value === 'REJECTED' ? 'danger' : 'success')" 
              :text="value === 'PENDING' ? 'În așteptare' : (value === 'REJECTED' ? 'Ofertă refuzată' : (value === 'ACCEPTED' ? 'Ofertă acceptată' : 'Ofertă primită'))" 
            />
          </template>
          <template #cell(offer_price)="{ value }">
            <span v-if="value">{{ value }} EUR</span>
            <span v-else class="text--secondary">-</span>
          </template>
          <template #cell(actions)="{ row }">
            <va-button 
              v-if="row.source.status !== 'PENDING'" 
              size="small" 
              preset="secondary"
              icon="visibility" 
              @click="viewDetails(row.source)"
            >
              Vezi mesaj
            </va-button>
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <va-modal v-model="showModal" title="Detalii Ofertă" hide-default-actions>
      <div v-if="selectedOffer">
        <p class="mb-3">Preț propus: <strong>{{ selectedOffer.offer_price }} EUR</strong></p>
        <va-card color="background-element">
          <va-card-content v-if="parsedDetails(selectedOffer.offer_details)">
            <div class="mb-2" v-if="parsedDetails(selectedOffer.offer_details).start_date && parsedDetails(selectedOffer.offer_details).end_date">
              <strong>Perioadă contract:</strong> {{ parsedDetails(selectedOffer.offer_details).start_date }} &rarr; {{ parsedDetails(selectedOffer.offer_details).end_date }}
            </div>
            <div class="mb-2"><strong>Garanție:</strong> {{ parsedDetails(selectedOffer.offer_details).deposit_eur }} EUR</div>
            <div class="mb-2"><strong>Utilități/lună:</strong> {{ parsedDetails(selectedOffer.offer_details).utilities_ron }} RON</div>
            <hr class="my-3" v-if="parsedDetails(selectedOffer.offer_details).message" />
            <p style="white-space: pre-line;" v-if="parsedDetails(selectedOffer.offer_details).message">{{ parsedDetails(selectedOffer.offer_details).message }}</p>
          </va-card-content>
          <va-card-content v-else style="white-space: pre-line;">
            {{ selectedOffer.offer_details || 'Niciun mesaj suplimentar.' }}
          </va-card-content>
        </va-card>
      </div>
      <template #footer>
        <div v-if="selectedOffer && selectedOffer.status === 'SENT'">
          <va-button color="danger" preset="secondary" @click="rejectOffer(selectedOffer.id)" class="mr-2">Refuză</va-button>
          <va-button color="success" @click="acceptOffer(selectedOffer.id)" class="mr-4">Acceptă</va-button>
          <va-button @click="showModal = false">Închide</va-button>
        </div>
        <div v-else>
          <va-button @click="showModal = false">Închide</va-button>
        </div>
      </template>
    </va-modal>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from 'vuestic-ui';
import api from '../../services/api';

export default {
  name: 'MyOffers',
  setup() {
    const offers = ref([]);
    const loading = ref(false);
    const showModal = ref(false);
    const selectedOffer = ref(null);

    const cols = [
      { key: 'image', label: 'Imagine' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'created_at', label: 'Data cererii' },
      { key: 'status', label: 'Status' },
      { key: 'offer_price', label: 'Preț Ofertat' },
      { key: 'actions', label: '' }
    ];

    const load = async () => {
      loading.value = true;
      try {
        const res = await api.get('/offers/mine');
        offers.value = res.data.map(o => ({
          ...o,
          created_at: new Date(o.created_at).toLocaleDateString('ro-RO')
        }));
      } catch (err) {
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const viewDetails = (offer) => {
      selectedOffer.value = offer;
      showModal.value = true;
    };

    const parsedDetails = (detailsStr) => {
      if (!detailsStr) return null;
      try {
        const obj = JSON.parse(detailsStr);
        if (obj && typeof obj === 'object' && 'deposit_eur' in obj) {
          return obj;
        }
        return null;
      } catch(e) {
        return null;
      }
    };

    const { init } = useToast();
    const store = useStore();
    const router = useRouter();

    const acceptOffer = async (id) => {
      try {
        const res = await api.patch(`/offers/${id}/accept`);
        
        // Update user session if token is provided
        if (res.data.token && res.data.user) {
          store.commit("auth_success", { token: res.data.token, user: res.data.user });
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        init({ message: 'Felicitări! Ai acceptat oferta și ești acum chiriaș.', color: 'success' });
        showModal.value = false;
        
        // Redirect to dashboard to see the new layout and features
        router.push('/app/dashboard');
      } catch (err) {
        init({ message: err.response?.data?.message || 'Eroare la acceptarea ofertei.', color: 'danger' });
      }
    };

    const rejectOffer = async (id) => {
      try {
        await api.patch(`/offers/${id}/reject`);
        init({ message: 'Oferta a fost refuzată.', color: 'success' });
        showModal.value = false;
        load();
      } catch (err) {
        init({ message: err.response?.data?.message || 'Eroare la refuzarea ofertei.', color: 'danger' });
      }
    };

    onMounted(load);

    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=Spatiu';
      return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };

    return { offers, loading, cols, showModal, selectedOffer, viewDetails, parsedDetails, acceptOffer, rejectOffer, getImageUrl };
  }
};
</script>
