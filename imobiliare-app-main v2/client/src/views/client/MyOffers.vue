<template>
  <div>
    <div class="page-title">Ofertele mele</div>

    <n-card :bordered="true">
      <div v-if="loading" class="text-center" style="padding: 40px; display: flex; justify-content: center;"><n-spin size="large" /></div>
      
      <n-data-table v-else :data="offers" :columns="cols" :bordered="false" />
    </n-card>

    <n-modal v-model:show="showModal" title="Detalii Ofertă" preset="card" style="width: 550px;">
      <div v-if="selectedOffer">
        <p class="mb-3" style="margin-bottom: 12px; color: #f1f5f9;">Preț propus: <strong style="color: #10b981;">{{ selectedOffer.offer_price }} EUR</strong></p>
        <n-card :bordered="true" style="background: rgba(255, 255, 255, 0.03);">
          <div v-if="parsedDetails(selectedOffer.offer_details)">
            <div class="mb-2" style="margin-bottom: 8px; color: #cbd5e1;" v-if="parsedDetails(selectedOffer.offer_details).start_date && parsedDetails(selectedOffer.offer_details).end_date">
              <strong>Perioadă contract:</strong> {{ parsedDetails(selectedOffer.offer_details).start_date }} &rarr; {{ parsedDetails(selectedOffer.offer_details).end_date }}
            </div>
            <div class="mb-2" style="margin-bottom: 8px; color: #cbd5e1;" v-if="parsedDetails(selectedOffer.offer_details)?.deposit_eur !== undefined"><strong>Garanție:</strong> {{ parsedDetails(selectedOffer.offer_details).deposit_eur }} EUR</div>
            <hr class="my-3" style="border-color: rgba(255, 255, 255, 0.1); margin: 12px 0;" v-if="parsedDetails(selectedOffer.offer_details).message" />
            <p style="white-space: pre-line; color: #cbd5e1;" v-if="parsedDetails(selectedOffer.offer_details).message">{{ parsedDetails(selectedOffer.offer_details).message }}</p>
          </div>
          <div v-else style="white-space: pre-line; color: #cbd5e1;">
            {{ selectedOffer.offer_details || 'Niciun mesaj suplimentar.' }}
          </div>
        </n-card>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <template v-if="selectedOffer && selectedOffer.status === 'SENT'">
            <n-button type="error" secondary @click="rejectOffer(selectedOffer.id)">Refuză</n-button>
            <n-button type="success" @click="acceptOffer(selectedOffer.id)">Acceptă</n-button>
            <n-button @click="showModal = false">Închide</n-button>
          </template>
          <template v-else-if="selectedOffer && selectedOffer.status === 'PENDING'">
            <n-button type="error" @click="openCancelModal(selectedOffer.id)">
              <template #icon><n-icon><i class="material-icons">delete</i></n-icon></template>
              Anulează ofertă
            </n-button>
            <n-button @click="showModal = false">Închide</n-button>
          </template>
          <template v-else>
            <n-button @click="showModal = false">Închide</n-button>
          </template>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showCancelModal" title="Confirmare Anulare" preset="card" style="width: 450px;">
      <div style="text-align: center; padding: 12px 0;">
        <i class="material-icons" style="font-size: 48px; color: #ef4444; margin-bottom: 12px;">warning</i>
        <p style="font-weight: bold; font-size: 1.1rem; color: #f1f5f9; margin-bottom: 8px;">Sigur dorești să anulezi această ofertă?</p>
        <p style="font-size: 0.9rem; color: #94a3b8;">Odată anulată, oferta va fi ștearsă din sistem și vei putea trimite o nouă ofertă pentru acest spațiu.</p>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: center; gap: 12px; width: 100%;">
          <n-button secondary @click="showCancelModal = false">Înapoi</n-button>
          <n-button type="error" :loading="cancelling" @click="confirmCancel">
            <template #icon><n-icon><i class="material-icons">delete</i></n-icon></template>
            Da, anulează oferta
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, onMounted, h } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useMessage, NCard, NDataTable, NButton, NModal, NTag, NSpin, NIcon } from 'naive-ui';
import api from '../../services/api';

export default {
  name: 'MyOffers',
  components: { NCard, NDataTable, NButton, NModal, NTag, NSpin, NIcon },
  setup() {
    const offers = ref([]);
    const loading = ref(false);
    const showModal = ref(false);
    const showCancelModal = ref(false);
    const offerToCancelId = ref(null);
    const cancelling = ref(false);
    const selectedOffer = ref(null);
    const message = useMessage();
    const store = useStore();
    const router = useRouter();

    const cols = [
      { key: 'image', title: 'Imagine', width: 80, render(row) { return h('img', { src: getImageUrl(row.image_path), style: 'width: 60px; height: 40px; object-fit: cover; border-radius: 4px; display: block;' }); } },
      { key: 'property_title', title: 'Spațiu' },
      { key: 'created_at', title: 'Data ofertei' },
      { key: 'status', title: 'Status', render(row) {
        const typeMap = { PENDING: 'warning', REJECTED: 'error', ACCEPTED: 'success', SENT: 'info' };
        const labelMap = { PENDING: 'În așteptare', REJECTED: 'Ofertă refuzată', ACCEPTED: 'Ofertă acceptată', SENT: 'Ofertă primită' };
        return h(NTag, { type: typeMap[row.status] || 'default', size: 'small' }, { default: () => labelMap[row.status] || row.status });
      }},
      { key: 'actions', title: 'Acțiuni', width: 220, render(row) {
        return h('div', { style: 'display: flex; gap: 10px; align-items: center;' }, [
          h(NButton, { size: 'small', secondary: true, onClick: () => viewDetails(row) }, { default: () => 'Vezi ofertă', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          ...(row.status === 'PENDING' ? [
            h(NButton, { size: 'small', type: 'error', secondary: true, onClick: () => openCancelModal(row.id) }, { default: () => 'Anulează', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'delete') }) })
          ] : [])
        ]);
      }}
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
      let obj = {};
      if (detailsStr) {
        try {
          const parsed = JSON.parse(detailsStr);
          if (parsed && typeof parsed === 'object') obj = parsed;
        } catch(e) {}
      }
      if (selectedOffer.value && (obj.deposit_eur === undefined || obj.deposit_eur === null)) {
        const price = selectedOffer.value.offer_price || selectedOffer.value.property_price || 0;
        obj.deposit_eur = price * 2;
      }
      return obj;
    };

    const acceptOffer = async (id) => {
      try {
        const res = await api.patch(`/offers/${id}/accept`);
        
        if (res.data.token && res.data.user) {
          store.commit("auth_success", { token: res.data.token, user: res.data.user });
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        message.success('Felicitări! Ai acceptat oferta și ești acum chiriaș.');
        showModal.value = false;
        router.push('/app/dashboard');
      } catch (err) {
        message.error(err.response?.data?.message || 'Eroare la acceptarea ofertei.');
      }
    };

    const rejectOffer = async (id) => {
      try {
        await api.patch(`/offers/${id}/reject`);
        message.success('Oferta a fost refuzată.');
        showModal.value = false;
        load();
      } catch (err) {
        message.error(err.response?.data?.message || 'Eroare la refuzarea ofertei.');
      }
    };

    const openCancelModal = (id) => {
      offerToCancelId.value = id;
      showCancelModal.value = true;
    };

    const confirmCancel = async () => {
      if (!offerToCancelId.value) return;
      cancelling.value = true;
      try {
        await api.delete(`/offers/${offerToCancelId.value}`);
        message.success('Oferta a fost anulată cu succes.');
        showCancelModal.value = false;
        showModal.value = false;
        load();
      } catch (err) {
        message.error(err.response?.data?.message || 'Eroare la anularea ofertei.');
      } finally {
        cancelling.value = false;
      }
    };

    onMounted(load);

    const getImageUrl = (path) => {
      if (!path) return 'https://placehold.co/400x300?text=Spatiu';
      return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };

    return { offers, loading, cols, showModal, showCancelModal, cancelling, selectedOffer, viewDetails, parsedDetails, acceptOffer, rejectOffer, openCancelModal, confirmCancel, getImageUrl };
  }
};
</script>
