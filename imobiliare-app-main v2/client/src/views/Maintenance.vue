<template>
  <div>
    <div class="page-title">Intervenții tehnice</div>
    <div class="toolbar">
      <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="Toate stările" clearable @update:value="load" style="width: 180px;" />
      <n-select v-model:value="prioFilter" :options="prioOptions" placeholder="Toate prioritățile" clearable @update:value="load" style="width: 180px;" />
      <span class="spacer"></span>
      <n-button type="primary" @click="openCreate">
        <template #icon><n-icon><i class="material-icons">add</i></n-icon></template>
        Intervenție nouă
      </n-button>
    </div>

    <n-card>
      <n-data-table :columns="columns" :data="items" :loading="loading" :bordered="false" />
    </n-card>

    <n-modal v-model:show="showModal" title="Intervenție nouă" preset="card" style="width: 600px;">
      <n-form-item label="Spațiu">
        <n-select v-model:value="form.property_id" :options="propertyOpts" filterable placeholder="Caută spațiu..." />
      </n-form-item>
      <n-form-item label="Prioritate">
        <n-select v-model:value="form.priority" :options="prioOptions" />
      </n-form-item>
      <n-form-item label="Descrierea problemei">
        <n-input v-model:value="form.description" type="textarea" :rows="3" />
      </n-form-item>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <n-button @click="showModal = false">Anulează</n-button>
          <n-button type="primary" @click="save">Trimite</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, h } from 'vue';
import { useMessage, NCard, NDataTable, NButton, NInput, NSelect, NModal, NTag, NFormItem, NIcon } from 'naive-ui';
import api from '../services/api';
import { PRIORITY, MAINT_STATUS } from '../services/labels';

export default {
  name: 'Maintenance',
  components: { NCard, NDataTable, NButton, NInput, NSelect, NModal, NTag, NFormItem, NIcon },
  setup() {
    const message = useMessage();
    const items = ref([]);
    const loading = ref(false);
    const statusFilter = ref(null);
    const prioFilter = ref(null);
    const showModal = ref(false);
    const form = reactive({ priority: 'MEDIUM' });
    const propertyOpts = ref([]);
    const P = PRIORITY;
    const MS = MAINT_STATUS;
    const prioTypeMap = { LOW: 'default', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error' };
    const statusTypeMap = { OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success' };

    const columns = [
      { title: 'Spațiu', key: 'property_title' },
      { title: 'Descriere', key: 'description' },
      { title: 'Prioritate', key: 'priority', render(row) { const p = P[row.priority]; return h(NTag, { type: prioTypeMap[row.priority] || 'default', size: 'small' }, { default: () => p?.label || row.priority }); } },
      { title: 'Responsabil', key: 'employee_name' },
      { title: 'Stare', key: 'status', render(row) { const s = MS[row.status]; return h(NTag, { type: statusTypeMap[row.status] || 'default', size: 'small' }, { default: () => s?.label || row.status }); } },
      { title: '', key: 'actions', width: 120, render(row) {
        return h('div', { style: 'display: flex; gap: 14px; align-items: center;' }, [
          ...(row.status === 'OPEN' ? [h(NButton, { text: true, type: 'info', onClick: () => setStatus(row.id, 'IN_PROGRESS'), title: 'În lucru' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'engineering') }) })] : []),
          ...(row.status !== 'RESOLVED' ? [h(NButton, { text: true, type: 'success', onClick: () => resolve(row.id), title: 'Rezolvă' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'task_alt') }) })] : []),
        ]);
      }},
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
      propertyOpts.value = props.map(p => {
        const cleanAddr = p.address.replace(/,\s*Bucure[sș]ti/gi, '').replace(/,\s*Rom[aâ]nia/gi, '').replace(/,\s*Sector\s*\d/gi, '').trim();
        return { value: p.id, label: `🏢 ${p.title}  —  📍 ${cleanAddr}` };
      });
      showModal.value = true;
    };
    const save = async () => {
      try { await api.post('/maintenance', form); message.success('Intervenție creată.'); showModal.value = false; load(); }
      catch (e) { message.error(e.response?.data?.message || 'Eroare.'); }
    };
    const setStatus = async (id, status) => {
      try { await api.patch(`/maintenance/${id}`, { status }); load(); }
      catch (e) { message.error('Eroare.'); }
    };
    const resolve = async (id) => {
      const notes = prompt('Note privind soluția:') || '';
      try { await api.patch(`/maintenance/${id}`, { status: 'RESOLVED', resolution_notes: notes }); message.success('Marcată rezolvată.'); load(); }
      catch (e) { message.error('Eroare.'); }
    };
    onMounted(load);
    return { items, loading, statusFilter, prioFilter, statusOptions, prioOptions, columns, showModal, form, propertyOpts, openCreate, save, setStatus, resolve, load };
  }
};
</script>

<style scoped>.modal-form { min-width: 550px; max-width: 100%; }</style>
