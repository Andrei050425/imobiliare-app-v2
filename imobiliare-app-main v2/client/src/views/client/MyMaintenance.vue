<template>
  <div>
    <div class="page-title">Intervenții</div>
    <div class="toolbar">
      <span class="spacer"></span>
      <va-button icon="add" @click="openCreate">Solicită o intervenție</va-button>
    </div>
    <va-card>
      <va-card-content>
        <va-data-table :items="items" :columns="cols" :loading="loading" no-data-html="Nicio solicitare.">
          <template #cell(priority)="{ value }"><va-badge :color="P[value]?.color" :text="P[value]?.label || value" /></template>
          <template #cell(status)="{ value }"><va-badge :color="MS[value]?.color" :text="MS[value]?.label || value" /></template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <va-modal v-model="showModal" title="Solicită o intervenție" hide-default-actions>
      <div class="modal-form">
        <va-select v-model="form.property_id" :options="propertyOpts" text-by="label" value-by="value" label="Spațiu" class="mb-2" />
        <va-select v-model="form.priority" :options="prioOptions" text-by="label" value-by="value" label="Prioritate" class="mb-2" />
        <va-textarea v-model="form.description" label="Descrierea problemei" :min-rows="3" class="mb-2" />
      </div>
      <template #footer>
        <va-button preset="secondary" @click="showModal = false">Anulează</va-button>
        <va-button class="ml-2" @click="save">Trimite solicitarea</va-button>
      </template>
    </va-modal>
  </div>
</template>
<script>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'vuestic-ui';
import api from '../../services/api';
import { PRIORITY, MAINT_STATUS } from '../../services/labels';
export default {
  name: 'MyMaintenance',
  setup() {
    const { init } = useToast();
    const items = ref([]); const loading = ref(true);
    const showModal = ref(false);
    const form = reactive({ priority: 'MEDIUM' });
    const propertyOpts = ref([]);
    const cols = [
      { key: 'property_title', label: 'Spațiu' },
      { key: 'description', label: 'Descriere' },
      { key: 'priority', label: 'Prioritate' },
      { key: 'status', label: 'Stare' },
    ];
    const prioOptions = Object.entries(PRIORITY).map(([value, v]) => ({ value, label: v.label }));
    const load = async () => {
      loading.value = true;
      try { items.value = (await api.get('/maintenance/mine')).data; } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    const openCreate = async () => {
      Object.keys(form).forEach(k => delete form[k]); form.priority = 'MEDIUM';
      try { propertyOpts.value = (await api.get('/contracts/mine')).data.map(c => ({ value: c.property_id, label: c.property_title })); }
      catch (e) { propertyOpts.value = []; }
      showModal.value = true;
    };
    const save = async () => {
      try { await api.post('/maintenance', form); init({ message: 'Solicitare trimisă.', color: 'success' }); showModal.value = false; load(); }
      catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
    };
    onMounted(load);
    return { items, loading, cols, P: PRIORITY, MS: MAINT_STATUS, showModal, form, propertyOpts, prioOptions, openCreate, save };
  }
};
</script>
<style scoped>.modal-form { min-width: 400px; }</style>
