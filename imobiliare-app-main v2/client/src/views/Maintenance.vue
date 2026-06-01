<template>
  <div>
    <div class="page-title">Intervenții tehnice</div>
    <div class="toolbar">
      <va-select v-model="statusFilter" :options="statusOptions" text-by="label" value-by="value" placeholder="Toate stările" clearable @update:modelValue="load" />
      <va-select v-model="prioFilter" :options="prioOptions" text-by="label" value-by="value" placeholder="Toate prioritățile" clearable @update:modelValue="load" />
      <span class="spacer"></span>
      <va-button icon="add" @click="openCreate">Intervenție nouă</va-button>
    </div>

    <va-card>
      <va-card-content>
        <va-data-table :items="items" :columns="cols" :loading="loading">
          <template #cell(priority)="{ value }"><va-badge :color="P[value]?.color" :text="P[value]?.label || value" /></template>
          <template #cell(status)="{ value }"><va-badge :color="MS[value]?.color" :text="MS[value]?.label || value" /></template>
          <template #cell(actions)="{ row }">
            <va-button v-if="row.source.status === 'OPEN'" preset="plain" color="info" icon="engineering" title="În lucru" @click="setStatus(row.source.id, 'IN_PROGRESS')" />
            <va-button v-if="row.source.status !== 'RESOLVED'" preset="plain" color="success" icon="task_alt" title="Rezolvă" @click="resolve(row.source.id)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <va-modal v-model="showModal" title="Intervenție nouă" hide-default-actions>
      <div class="modal-form">
        <va-select v-model="form.property_id" :options="propertyOpts" text-by="label" value-by="value" label="Spațiu" class="mb-2" />
        <va-select v-model="form.priority" :options="prioOptions" text-by="label" value-by="value" label="Prioritate" class="mb-2" />
        <va-textarea v-model="form.description" label="Descrierea problemei" :min-rows="3" class="mb-2" />
      </div>
      <template #footer>
        <va-button preset="secondary" @click="showModal = false">Anulează</va-button>
        <va-button class="ml-2" @click="save">Trimite</va-button>
      </template>
    </va-modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'vuestic-ui';
import api from '../services/api';
import { PRIORITY, MAINT_STATUS } from '../services/labels';

export default {
  name: 'Maintenance',
  setup() {
    const { init } = useToast();
    const items = ref([]);
    const loading = ref(false);
    const statusFilter = ref(null);
    const prioFilter = ref(null);
    const showModal = ref(false);
    const form = reactive({ priority: 'MEDIUM' });
    const propertyOpts = ref([]);
    const cols = [
      { key: 'property_title', label: 'Spațiu' },
      { key: 'description', label: 'Descriere' },
      { key: 'priority', label: 'Prioritate' },
      { key: 'employee_name', label: 'Responsabil' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: '' },
    ];
    const statusOptions = Object.entries(MAINT_STATUS).map(([value, v]) => ({ value, label: v.label }));
    const prioOptions = Object.entries(PRIORITY).map(([value, v]) => ({ value, label: v.label }));
    const load = async () => {
      loading.value = true;
      try {
        const params = {};
        if (statusFilter.value) params.status = statusFilter.value;
        if (prioFilter.value) params.priority = prioFilter.value;
        items.value = (await api.get('/maintenance', { params })).data;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    const openCreate = async () => {
      Object.keys(form).forEach(k => delete form[k]); form.priority = 'MEDIUM';
      const props = (await api.get('/properties')).data;
      propertyOpts.value = props.map(p => ({ value: p.id, label: `${p.title} — ${p.address}` }));
      showModal.value = true;
    };
    const save = async () => {
      try { await api.post('/maintenance', form); init({ message: 'Intervenție creată.', color: 'success' }); showModal.value = false; load(); }
      catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
    };
    const setStatus = async (id, status) => {
      try { await api.patch(`/maintenance/${id}`, { status }); load(); }
      catch (e) { init({ message: 'Eroare.', color: 'danger' }); }
    };
    const resolve = async (id) => {
      const notes = prompt('Note privind soluția:') || '';
      try { await api.patch(`/maintenance/${id}`, { status: 'RESOLVED', resolution_notes: notes }); init({ message: 'Marcată rezolvată.', color: 'success' }); load(); }
      catch (e) { init({ message: 'Eroare.', color: 'danger' }); }
    };
    onMounted(load);
    return { items, loading, statusFilter, prioFilter, statusOptions, prioOptions, cols, P: PRIORITY, MS: MAINT_STATUS, showModal, form, propertyOpts, openCreate, save, setStatus, resolve, load };
  }
};
</script>

<style scoped>.modal-form { min-width: 420px; }</style>
