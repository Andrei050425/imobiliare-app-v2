<template>
  <div>
    <div class="page-title">Contracte</div>
    <div class="toolbar">
      <va-select v-model="statusFilter" :options="statusOptions" text-by="label" value-by="value" placeholder="Toate stările" clearable @update:modelValue="load" />
      <span class="spacer"></span>
      <va-button v-if="isAdmin" icon="add" @click="openCreate">Contract nou</va-button>
    </div>

    <va-card>
      <va-card-content>
        <va-data-table :items="contracts" :columns="cols" :loading="loading">
          <template #cell(period)="{ row }">{{ row.source.start_date }} → {{ row.source.end_date }}</template>
          <template #cell(monthly_rent_eur)="{ value }">{{ value }} €</template>
          <template #cell(status)="{ value }">
            <va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" />
          </template>
          <template #cell(actions)="{ row }">
            <va-button v-if="isAdmin && row.source.status === 'DRAFT'" preset="plain" color="success" icon="check_circle" title="Activează" @click="activate(row.source.id)" />
            <va-button v-if="isAdmin && row.source.status === 'ACTIVE'" preset="plain" color="danger" icon="cancel" title="Reziliază" @click="terminate(row.source.id)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <va-modal v-model="showModal" title="Contract nou" hide-default-actions>
      <div class="modal-form">
        <va-select v-model="form.tenant_id" :options="tenantOpts" text-by="label" value-by="value" label="Chiriaș" class="mb-2" />
        <va-select v-model="form.property_id" :options="propertyOpts" text-by="label" value-by="value" label="Spațiu disponibil" class="mb-2" />
        <div class="row">
          <div class="flex xs6"><va-input v-model="form.start_date" type="date" label="Data început" class="mb-2" /></div>
          <div class="flex xs6"><va-input v-model="form.end_date" type="date" label="Data sfârșit" class="mb-2" /></div>
        </div>
        <div class="row">
          <div class="flex xs6"><va-input v-model.number="form.monthly_rent_eur" type="number" label="Chirie lunară (EUR)" class="mb-2" /></div>
          <div class="flex xs6"><va-input v-model.number="form.deposit_eur" type="number" label="Garanție (EUR)" class="mb-2" /></div>
        </div>
        <div class="row">
          <div class="flex xs6"><va-input v-model.number="form.utilities_ron" type="number" label="Utilități/lună (RON)" class="mb-2" /></div>
          <div class="flex xs6"><va-input v-model.number="form.billing_day" type="number" label="Zi facturare (1-28)" class="mb-2" /></div>
        </div>
      </div>
      <template #footer>
        <va-button preset="secondary" @click="showModal = false">Anulează</va-button>
        <va-button class="ml-2" @click="save">Salvează contract</va-button>
      </template>
    </va-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vuestic-ui';
import api from '../services/api';
import { CONTRACT_STATUS } from '../services/labels';

export default {
  name: 'Contracts',
  setup() {
    const store = useStore();
    const { init } = useToast();
    const contracts = ref([]);
    const loading = ref(false);
    const statusFilter = ref(null);
    const showModal = ref(false);
    const form = reactive({ billing_day: 1, deposit_eur: 0, utilities_ron: 0 });
    const tenantOpts = ref([]);
    const propertyOpts = ref([]);
    const isAdmin = computed(() => store.getters.isAdmin);

    const cols = [
      { key: 'contract_number', label: 'Nr. contract' },
      { key: 'tenant_name', label: 'Chiriaș' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'period', label: 'Perioadă' },
      { key: 'monthly_rent_eur', label: 'Chirie' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: '' },
    ];
    const statusOptions = Object.entries(CONTRACT_STATUS).map(([value, v]) => ({ value, label: v.label }));

    const load = async () => {
      loading.value = true;
      try {
        const params = {};
        if (statusFilter.value) params.status = statusFilter.value;
        contracts.value = (await api.get('/contracts', { params })).data;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    const openCreate = async () => {
      Object.keys(form).forEach(k => delete form[k]);
      form.billing_day = 1; form.deposit_eur = 0; form.utilities_ron = 0;
      const tenants = (await api.get('/tenants')).data.filter(t => t.status !== 'OVERDUE');
      tenantOpts.value = tenants.map(t => ({ value: t.id, label: `${t.company_name} (${t.cui})` }));
      const props = (await api.get('/properties', { params: { status: 'FREE' } })).data;
      propertyOpts.value = props.map(p => ({ value: p.id, label: `${p.title} — ${p.address}` }));
      showModal.value = true;
    };
    const save = async () => {
      try {
        await api.post('/contracts', form);
        init({ message: 'Contract creat (ciornă).', color: 'success' });
        showModal.value = false; load();
      } catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
    };
    const activate = async (id) => {
      try { await api.patch(`/contracts/${id}/activate`); init({ message: 'Contract activat.', color: 'success' }); load(); }
      catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
    };
    const terminate = async (id) => {
      const reason = prompt('Motivul rezilierii:');
      try { await api.patch(`/contracts/${id}/terminate`, { reason }); init({ message: 'Contract reziliat.', color: 'success' }); load(); }
      catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
    };

    onMounted(load);
    return { contracts, loading, statusFilter, statusOptions, cols, ST: CONTRACT_STATUS, isAdmin, showModal, form, tenantOpts, propertyOpts, openCreate, save, activate, terminate, load };
  }
};
</script>

<style scoped>.modal-form { min-width: 460px; }</style>
