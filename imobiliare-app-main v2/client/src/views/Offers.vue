<template>
  <div>
    <div class="page-title">Cereri și Oferte</div>
    
    <va-tabs v-model="activeTab" class="mb-4">
      <template #tabs>
        <va-tab name="active">Cereri active</va-tab>
        <va-tab name="sent">Oferte trimise</va-tab>
        <va-tab name="rejected">Cereri respinse</va-tab>
      </template>
    </va-tabs>

    <va-card>
      <va-card-content>
        <div v-if="loading" class="text-center"><va-progress-circle indeterminate /></div>
        <va-data-table v-else :items="filteredOffers" :columns="cols" no-data-html="Nu există date.">
          <template #cell(image)="{ row }">
            <img :src="getImageUrl(row.source.image_path)" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; display: block;" />
          </template>
          <template #cell(offer_price)="{ value }">
            {{ value ? value + ' EUR' : '-' }}
          </template>
          <template #cell(status)="{ value }">
            <va-badge 
              :color="value === 'PENDING' ? 'warning' : (value === 'REJECTED' ? 'danger' : (value === 'ACCEPTED' ? 'success' : 'info'))" 
              :text="value === 'PENDING' ? 'În așteptare' : (value === 'REJECTED' ? 'Refuzată' : (value === 'ACCEPTED' ? 'Acceptată' : 'Trimisă'))" 
            />
          </template>
          <template #cell(actions)="{ row }">
            <va-button 
              v-if="row.source.status === 'PENDING'" 
              preset="plain"
              color="primary"
              icon="send" 
              title="Trimite Ofertă"
              @click="openModal(row.source)"
            />
            <va-button 
              v-if="row.source.status === 'PENDING'" 
              preset="plain"
              color="danger"
              icon="cancel" 
              title="Anulează cererea"
              @click="cancelOffer(row.source.id)"
            />
            <va-button 
              v-if="row.source.status !== 'PENDING'" 
              preset="plain"
              color="info"
              icon="visibility" 
              title="Vizualizare detalii"
              @click="openDetailsModal(row.source)"
            />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <va-modal v-model="showModal" title="Trimite Ofertă" @ok="sendOffer">
      <div v-if="selectedOffer" class="modal-form">
        <p class="mb-3">Cerere de la <strong>{{ selectedOffer.user_name }}</strong> pentru spațiul <strong>{{ selectedOffer.property_title }}</strong>.</p>
        
        <div class="row">
          <div class="flex xs6"><va-input v-model="offerData.start_date" type="date" label="Data început" class="mb-2" /></div>
          <div class="flex xs6"><va-input v-model="offerData.end_date" type="date" label="Data sfârșit" class="mb-2" /></div>
        </div>
        <div class="row">
          <div class="flex xs6"><va-input v-model.number="offerData.price" type="number" label="Chirie lunară (EUR)" class="mb-2" @update:modelValue="offerData.deposit_eur = offerData.price * 2" /></div>
          <div class="flex xs6"><va-input v-model.number="offerData.deposit_eur" type="number" label="Garanție (EUR)" class="mb-2" /></div>
        </div>
        <div class="row">
          <div class="flex xs12"><va-input v-model.number="offerData.utilities_ron" type="number" label="Utilități/lună (RON)" class="mb-2" /></div>
        </div>
        
        <va-input 
          v-model="offerData.details" 
          label="Detalii / Mesaj" 
          type="textarea" 
          :min-rows="2" 
          bordered 
        />
      </div>
    </va-modal>

    <va-modal v-model="showDetailsModal" title="Detalii Ofertă" hide-default-actions>
      <div v-if="selectedDetails" class="modal-form">
        <va-input :modelValue="selectedDetails.user_name" label="Client" class="mb-2" readonly />
        <va-input :modelValue="selectedDetails.property_title" label="Spațiu vizat" class="mb-2" readonly />
        <va-input :modelValue="selectedDetails.offer_price + ' EUR'" label="Chirie ofertată" class="mb-2" readonly />
        <va-input :modelValue="selectedDetails.deposit_eur ? (selectedDetails.deposit_eur + ' EUR') : '-'" label="Garanție" class="mb-2" readonly />
        <va-input :modelValue="selectedDetails.utilities_ron ? (selectedDetails.utilities_ron + ' RON') : '-'" label="Utilități" class="mb-2" readonly />
        <div class="row">
          <div class="flex xs6"><va-input :modelValue="selectedDetails.start_date || '-'" label="Data început" class="mb-2" readonly /></div>
          <div class="flex xs6"><va-input :modelValue="selectedDetails.end_date || '-'" label="Data sfârșit" class="mb-2" readonly /></div>
        </div>
        <va-input :modelValue="selectedDetails.message || '-'" label="Mesaj / Detalii" type="textarea" class="mb-2" readonly />
        
        <div class="mt-3">
          <span style="color: var(--va-primary); font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Status curent:</span>
          <va-badge class="ml-2" 
            :color="selectedDetails.status === 'REJECTED' ? 'danger' : (selectedDetails.status === 'ACCEPTED' ? 'success' : 'info')" 
            :text="selectedDetails.status === 'REJECTED' ? 'Refuzată' : (selectedDetails.status === 'ACCEPTED' ? 'Acceptată' : 'Trimisă')" 
          />
        </div>
      </div>
      <template #footer>
        <va-button @click="showDetailsModal = false">Închide</va-button>
      </template>
    </va-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'vuestic-ui';
import api from '../services/api';

export default {
  name: 'Offers',
  setup() {
    const { init } = useToast();
    const offers = ref([]);
    const loading = ref(false);
    const activeTab = ref('active'); // 'active', 'sent', 'rejected'
    const showModal = ref(false);
    const showDetailsModal = ref(false);
    const selectedDetails = ref(null);
    const selectedOffer = ref(null);
    const offerData = ref({ start_date: '', end_date: '', price: '', deposit_eur: 0, utilities_ron: 0, details: '' });

    watch(() => offerData.value.start_date, (newDate) => {
      if (newDate) {
        const dateObj = new Date(newDate);
        if (!isNaN(dateObj.getTime())) {
          dateObj.setFullYear(dateObj.getFullYear() + 1);
          offerData.value.end_date = dateObj.toISOString().split('T')[0];
        }
      }
    });

    const cols = [
      { key: 'image', label: 'Imagine' },
      { key: 'user_name', label: 'Client' },
      { key: 'user_phone', label: 'Telefon' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'created_at', label: 'Data cererii' },
      { key: 'offer_price', label: 'Preț Ofertat' },
      { key: 'status', label: 'Status' },
      { key: 'actions', label: 'Acțiuni' }
    ];

    const load = async () => {
      loading.value = true;
      try {
        const res = await api.get('/offers');
        // Format date string for readability
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

    const filteredOffers = computed(() => {
      if (activeTab.value === 'active') return offers.value.filter(o => o.status === 'PENDING');
      if (activeTab.value === 'sent') return offers.value.filter(o => ['SENT', 'ACCEPTED'].includes(o.status));
      if (activeTab.value === 'rejected') return offers.value.filter(o => o.status === 'REJECTED');
      return offers.value;
    });

    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=Spatiu';
      return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };

    const openModal = (offer) => {
      selectedOffer.value = offer;
      const price = offer.property_price || 0;
      offerData.value = { 
        start_date: '',
        end_date: '',
        price: price, 
        deposit_eur: price * 2,
        utilities_ron: 0,
        details: '' 
      };
      showModal.value = true;
    };

    const openDetailsModal = (offer) => {
      let parsed = {};
      if (offer.offer_details) {
        try { parsed = JSON.parse(offer.offer_details); } catch(e) {}
      }
      selectedDetails.value = { ...offer, ...parsed };
      showDetailsModal.value = true;
    };

    const sendOffer = async () => {
      try {
        const composedDetails = JSON.stringify({
          start_date: offerData.value.start_date,
          end_date: offerData.value.end_date,
          deposit_eur: offerData.value.deposit_eur,
          utilities_ron: offerData.value.utilities_ron,
          message: offerData.value.details
        });
        await api.patch(`/offers/${selectedOffer.value.id}/send`, {
          offer_price: Number(offerData.value.price),
          offer_details: composedDetails
        });
        init({ message: 'Oferta a fost trimisă cu succes!', color: 'success' });
        load();
      } catch (err) {
        init({ message: 'Eroare la trimiterea ofertei.', color: 'danger' });
      }
    };

    const cancelOffer = async (id) => {
      if (!confirm('Ești sigur că vrei să anulezi/ștergi această cerere?')) return;
      try {
        await api.delete(`/offers/${id}`);
        init({ message: 'Cererea a fost anulată cu succes.', color: 'success' });
        load();
      } catch (err) {
        init({ message: 'Eroare la anularea cererii.', color: 'danger' });
      }
    };

    onMounted(load);

    return {
      offers, loading, activeTab, cols, filteredOffers, getImageUrl,
      showModal, showDetailsModal, selectedOffer, selectedDetails, offerData, 
      openModal, openDetailsModal, sendOffer, cancelOffer
    };
  }
};
</script>

<style scoped>
.modal-form { min-width: 460px; }
</style>
