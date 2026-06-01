<template>
  <div>
    <div class="page-title">Chiriași</div>
    <div class="toolbar">
      <va-input v-model="search" placeholder="Caută după denumire sau CUI..." @keyup.enter="load">
        <template #prependInner><va-icon name="search" /></template>
      </va-input>
      <va-select v-model="statusFilter" :options="statusOptions" text-by="label" value-by="value" placeholder="Toate stările" clearable @update:modelValue="load" />
      <span class="spacer"></span>
      <va-button v-if="isAdmin" icon="add" @click="openCreate">Chiriaș nou</va-button>
    </div>

    <va-card>
      <va-card-content>
        <va-data-table :items="tenants" :columns="cols" :loading="loading">
          <template #cell(status)="{ value }">
            <va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" />
          </template>
          <template #cell(actions)="{ row }">
            <va-button v-if="isAdmin" preset="plain" icon="edit" @click="openEdit(row.source)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <va-modal v-model="showModal" :title="editing ? 'Editează chiriaș' : 'Chiriaș nou'" hide-default-actions>
      <div class="modal-form">
        <va-input v-model="form.company_name" label="Denumire firmă" class="mb-2" />
        <va-input v-model="form.cui" label="CUI" class="mb-2" :disabled="editing" />
        <va-input v-model="form.reg_no" label="Nr. Reg. Comerțului" class="mb-2" />
        <va-input v-model="form.address" label="Adresă" class="mb-2" />
        <va-input v-model="form.email" label="Email" class="mb-2" />
        <va-input v-model="form.phone" label="Telefon" class="mb-2" />
        <va-input v-model="form.legal_rep_name" label="Reprezentant legal" class="mb-2" />
        <va-select v-if="editing" v-model="form.status" :options="statusOptions" text-by="label" value-by="value" label="Stare" class="mb-2" />
      </div>
      <template #footer>
        <va-button preset="secondary" @click="showModal = false">Anulează</va-button>
        <va-button class="ml-2" @click="save">Salvează</va-button>
      </template>
    </va-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vuestic-ui';
import api from '../services/api';
import { TENANT_STATUS } from '../services/labels';

export default {
  name: 'Tenants',
  setup() {
    const store = useStore();
    const { init } = useToast();
    const tenants = ref([]);
    const loading = ref(false);
    const search = ref('');
    const statusFilter = ref(null);
    const showModal = ref(false);
    const editing = ref(false);
    const form = reactive({});
    const isAdmin = computed(() => store.getters.isAdmin);

    const cols = [
      { key: 'company_name', label: 'Denumire' },
      { key: 'cui', label: 'CUI' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telefon' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: '' },
    ];
    const statusOptions = Object.entries(TENANT_STATUS).map(([value, v]) => ({ value, label: v.label }));

    const load = async () => {
      loading.value = true;
      try {
        const params = {};
        if (search.value) params.q = search.value;
        if (statusFilter.value) params.status = statusFilter.value;
        tenants.value = (await api.get('/tenants', { params })).data;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    const openCreate = () => { editing.value = false; Object.keys(form).forEach(k => delete form[k]); showModal.value = true; };
    const openEdit = (t) => { editing.value = true; Object.assign(form, t); showModal.value = true; };
    const save = async () => {
      try {
        if (editing.value) await api.put(`/tenants/${form.id}`, form);
        else await api.post('/tenants', form);
        init({ message: 'Salvat cu succes.', color: 'success' });
        showModal.value = false;
        load();
      } catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
    };

    onMounted(load);
    return { tenants, loading, search, statusFilter, statusOptions, cols, ST: TENANT_STATUS, isAdmin, showModal, editing, form, openCreate, openEdit, save, load };
  }
};
</script>

<style scoped>.modal-form { min-width: 380px; }</style>
