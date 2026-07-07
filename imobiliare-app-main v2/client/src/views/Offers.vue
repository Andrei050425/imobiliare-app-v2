<template>
  <div>
    <div class="page-title">Oferte</div>
    
    <n-tabs v-model:value="activeTab" type="segment" style="margin-bottom: 16px;">
      <n-tab-pane name="active" tab="Oferte primite"></n-tab-pane>
      <n-tab-pane name="sent" tab="Oferte trimise"></n-tab-pane>
      <n-tab-pane name="accepted" tab="Oferte acceptate"></n-tab-pane>
      <n-tab-pane name="rejected" tab="Oferte respinse"></n-tab-pane>
    </n-tabs>

    <n-card>
      <div v-if="loading" style="display: flex; justify-content: center; padding: 40px;">
        <n-spin size="medium" />
      </div>
      <n-data-table v-else :columns="columns" :data="filteredOffers" :bordered="false" />
    </n-card>

    <n-modal v-model:show="showModal" title="Trimite Ofertă" preset="card" style="width: 600px;">
      <div v-if="selectedOffer" class="modal-form">
        <p style="margin-bottom: 12px;">Ofertă solicitată de la <strong>{{ selectedOffer.user_name }}</strong> pentru spațiul <strong>{{ selectedOffer.property_title }}</strong>.</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <n-form-item label="Data început"><n-input v-model:value="offerData.start_date" type="text" placeholder="YYYY-MM-DD" /></n-form-item>
          <n-form-item label="Data sfârșit"><n-input v-model:value="offerData.end_date" type="text" placeholder="YYYY-MM-DD" /></n-form-item>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <n-form-item label="Chirie lunară (EUR)"><n-input-number v-model:value="offerData.price" :min="0" @update:value="v => offerData.deposit_eur = v * 2" /></n-form-item>
          <n-form-item label="Garanție (EUR)"><n-input-number v-model:value="offerData.deposit_eur" :min="0" :disabled="true" :show-button="false" /></n-form-item>
        </div>
        <n-form-item label="Detalii / Mesaj"><n-input v-model:value="offerData.details" type="textarea" :rows="2" /></n-form-item>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <n-button @click="showModal = false">Anulează</n-button>
          <n-button type="primary" @click="sendOffer">Trimite oferta</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showDetailsModal" title="Detalii Ofertă" preset="card" style="width: 600px;">
      <div v-if="selectedDetails">
        <n-form-item label="Client"><n-input :value="selectedDetails.user_name" readonly /></n-form-item>
        <n-form-item label="Spațiu vizat"><n-input :value="selectedDetails.property_title" readonly /></n-form-item>
        <n-form-item label="Chirie ofertată"><n-input :value="selectedDetails.offer_price + ' EUR'" readonly /></n-form-item>
        <n-form-item label="Garanție"><n-input :value="selectedDetails.deposit_eur !== undefined && selectedDetails.deposit_eur !== null ? (selectedDetails.deposit_eur + ' EUR') : '-'" readonly /></n-form-item>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <n-form-item label="Data început"><n-input :value="selectedDetails.start_date || '-'" readonly /></n-form-item>
          <n-form-item label="Data sfârșit"><n-input :value="selectedDetails.end_date || '-'" readonly /></n-form-item>
        </div>
        <n-form-item label="Mesaj / Detalii"><n-input :value="selectedDetails.message || selectedDetails.details || (typeof selectedDetails.offer_details === 'string' && !selectedDetails.offer_details.startsWith('{') ? selectedDetails.offer_details : '-')" readonly type="textarea" /></n-form-item>
        
        <div style="margin-top: 12px;">
          <span style="color: #6366f1; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Status curent:</span>
          <n-tag :type="selectedDetails.status === 'PENDING' ? 'warning' : (selectedDetails.status === 'REJECTED' ? 'error' : (selectedDetails.status === 'ACCEPTED' ? 'success' : 'info'))" size="small" style="margin-left: 8px;">
            {{ selectedDetails.status === 'PENDING' ? 'Ofertă primită (în așteptare)' : (selectedDetails.status === 'REJECTED' ? 'Refuzată' : (selectedDetails.status === 'ACCEPTED' ? 'Acceptată' : 'Trimisă')) }}
          </n-tag>
        </div>
      </div>
      <template #footer>
        <n-button v-if="selectedDetails && selectedDetails.status === 'PENDING'" type="primary" @click="showDetailsModal = false; openModal(selectedDetails)" style="margin-right: 8px;">
          <template #icon><n-icon><i class="material-icons">send</i></n-icon></template>
          Răspunde / Trimite contract
        </n-button>
        <n-button @click="showDetailsModal = false">Închide</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, h } from 'vue';
import { useMessage, NCard, NDataTable, NButton, NInput, NInputNumber, NSelect, NModal, NTag, NFormItem, NTabs, NTabPane, NSpin, NIcon } from 'naive-ui';
import api from '../services/api';

export default {
  name: 'Offers',
  components: { NCard, NDataTable, NButton, NInput, NInputNumber, NSelect, NModal, NTag, NFormItem, NTabs, NTabPane, NSpin, NIcon },
  setup() {
    const message = useMessage();
    const offers = ref([]);
    const loading = ref(false);
    const activeTab = ref('active');
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

    const columns = [
      { title: 'Imagine', key: 'image', width: 80, render(row) { return h('img', { src: getImageUrl(row.image_path), style: 'width: 60px; height: 40px; object-fit: cover; border-radius: 4px; display: block;' }); } },
      { title: 'Client', key: 'user_name' },
      { title: 'Telefon', key: 'user_phone' },
      { title: 'Spațiu', key: 'property_title' },
      { title: 'Data ofertei', key: 'created_at' },
      { title: 'Preț Ofertat', key: 'offer_price', render(row) { return row.offer_price ? row.offer_price + ' EUR' : '-'; } },
      { title: 'Status', key: 'status', render(row) {
        const typeMap = { PENDING: 'warning', REJECTED: 'error', ACCEPTED: 'success', SENT: 'info' };
        const labelMap = { PENDING: 'În așteptare', REJECTED: 'Refuzată', ACCEPTED: 'Acceptată', SENT: 'Trimisă' };
        return h(NTag, { type: typeMap[row.status] || 'default', size: 'small' }, { default: () => labelMap[row.status] || row.status });
      }},
      { title: 'Acțiuni', key: 'actions', width: 160, render(row) {
        return h('div', { style: 'display: flex; gap: 14px; align-items: center;' }, [
          h(NButton, { text: true, type: 'info', onClick: () => openDetailsModal(row), title: 'Vizualizare ofertă' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          ...(row.status === 'PENDING' ? [
            h(NButton, { text: true, type: 'primary', onClick: () => openModal(row), title: 'Trimite răspuns' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'send') }) }),
            h(NButton, { text: true, type: 'error', onClick: () => cancelOffer(row.id), title: 'Anulează oferta' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'cancel') }) }),
          ] : []),
        ]);
      }},
    ];

    const load = async () => {
      loading.value = true;
      try {
        const res = await api.get('/offers');
        offers.value = res.data.map(o => ({
          ...o,
          created_at: new Date(o.created_at).toLocaleDateString('ro-RO')
        }));
      } catch (err) { console.error(err); }
      finally { loading.value = false; }
    };

    const filteredOffers = computed(() => {
      if (activeTab.value === 'active') return offers.value.filter(o => o.status === 'PENDING');
      if (activeTab.value === 'sent') return offers.value.filter(o => o.status === 'SENT');
      if (activeTab.value === 'accepted') return offers.value.filter(o => o.status === 'ACCEPTED');
      if (activeTab.value === 'rejected') return offers.value.filter(o => o.status === 'REJECTED');
      return offers.value;
    });

    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=Spatiu';
      return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };

    const openModal = (offer) => {
      selectedOffer.value = offer;
      let parsed = {};
      if (offer.offer_details) { try { parsed = JSON.parse(offer.offer_details); } catch(e) {} }
      const price = offer.offer_price || offer.property_price || 0;
      const deposit = parsed.deposit_eur !== undefined && parsed.deposit_eur !== null ? parsed.deposit_eur : price * 2;
      offerData.value = { 
        start_date: parsed.start_date || '', end_date: parsed.end_date || '',
        price: price, deposit_eur: deposit,
        utilities_ron: parsed.utilities_ron || 0, details: parsed.message || parsed.details || ''
      };
      showModal.value = true;
    };

    const openDetailsModal = (offer) => {
      let parsed = {};
      if (offer.offer_details) { try { parsed = JSON.parse(offer.offer_details); } catch(e) {} }
      const price = offer.offer_price || offer.property_price || 0;
      const deposit = parsed.deposit_eur !== undefined && parsed.deposit_eur !== null ? parsed.deposit_eur : price * 2;
      selectedDetails.value = { ...offer, ...parsed, deposit_eur: deposit };
      showDetailsModal.value = true;
    };

    const sendOffer = async () => {
      try {
        const composedDetails = JSON.stringify({
          start_date: offerData.value.start_date, end_date: offerData.value.end_date,
          deposit_eur: offerData.value.deposit_eur, utilities_ron: offerData.value.utilities_ron,
          message: offerData.value.details
        });
        await api.patch(`/offers/${selectedOffer.value.id}/send`, {
          offer_price: Number(offerData.value.price), offer_details: composedDetails
        });
        message.success('Oferta a fost trimisă cu succes!');
        showModal.value = false;
        load();
      } catch (err) { message.error('Eroare la trimiterea ofertei.'); }
    };

    const cancelOffer = async (id) => {
      if (!confirm('Ești sigur că vrei să anulezi/ștergi această ofertă?')) return;
      try {
        await api.delete(`/offers/${id}`);
        message.success('Oferta a fost anulată cu succes.');
        load();
      } catch (err) { message.error('Eroare la anularea ofertei.'); }
    };

    onMounted(load);
    return { offers, loading, activeTab, columns, filteredOffers, getImageUrl, showModal, showDetailsModal, selectedOffer, selectedDetails, offerData, openModal, openDetailsModal, sendOffer, cancelOffer };
  }
};
</script>

<style scoped>
.modal-form { min-width: 460px; }
</style>
