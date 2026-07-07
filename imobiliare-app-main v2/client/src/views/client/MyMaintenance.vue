<template>
  <div>
    <div class="page-title">Intervenții</div>
    <div class="toolbar">
      <span class="spacer"></span>
      <n-button type="primary" @click="openCreate">
        <template #icon><n-icon><i class="material-icons">add</i></n-icon></template>
        Solicită o intervenție
      </n-button>
    </div>
    <n-card :bordered="true">
      <n-data-table :data="items" :columns="cols" :loading="loading" :bordered="false" />
    </n-card>

    <n-modal v-model:show="showModal" title="Solicită o intervenție" preset="card" style="width: 500px;">
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <n-form-item label="Spațiu">
          <n-select v-model:value="form.property_id" :options="propertyOpts" placeholder="Alege spațiul..." />
        </n-form-item>
        <n-form-item label="Prioritate">
          <n-select v-model:value="form.priority" :options="prioOptions" placeholder="Alege prioritatea..." />
        </n-form-item>
        <n-form-item label="Descrierea problemei">
          <n-input v-model:value="form.description" type="textarea" :rows="3" placeholder="Descrie problema apărută..." />
        </n-form-item>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <n-button secondary @click="showModal = false">Anulează</n-button>
          <n-button type="primary" @click="save">Trimite solicitarea</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, h } from 'vue';
import { useMessage, NCard, NDataTable, NButton, NModal, NSelect, NInput, NTag, NIcon, NFormItem } from 'naive-ui';
import api from '../../services/api';
import { PRIORITY, MAINT_STATUS } from '../../services/labels';

export default {
  name: 'MyMaintenance',
  components: { NCard, NDataTable, NButton, NModal, NSelect, NInput, NTag, NIcon, NFormItem },
  setup() {
    const message = useMessage();
    const items = ref([]); 
    const loading = ref(true);
    const showModal = ref(false);
    const form = reactive({ priority: 'MEDIUM', property_id: null, description: '' });
    const propertyOpts = ref([]);
    const P = PRIORITY;
    const MS = MAINT_STATUS;
    const prioTypeMap = { LOW: 'default', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error' };
    const statusTypeMap = { OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success' };

    const cols = [
      { key: 'property_title', title: 'Spațiu' },
      { key: 'description', title: 'Descriere' },
      { key: 'priority', title: 'Prioritate', render(row) { const p = P[row.priority]; return h(NTag, { type: prioTypeMap[row.priority] || 'default', size: 'small' }, { default: () => p?.label || row.priority }); } },
      { key: 'status', title: 'Stare', render(row) { const s = MS[row.status]; return h(NTag, { type: statusTypeMap[row.status] || 'default', size: 'small' }, { default: () => s?.label || row.status }); } },
    ];

    const prioOptions = Object.entries(PRIORITY).map(([value, v]) => ({ value, label: v.label }));

    const load = async () => {
      loading.value = true;
      try { items.value = (await api.get('/maintenance/mine')).data; } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const openCreate = async () => {
      Object.keys(form).forEach(k => delete form[k]); 
      form.priority = 'MEDIUM';
      try { 
        const contracts = (await api.get('/contracts/mine')).data;
        propertyOpts.value = contracts.map(c => ({ value: c.property_id, label: c.property_title })); 
      } catch (e) { 
        propertyOpts.value = []; 
      }
      showModal.value = true;
    };

    const save = async () => {
      if (!form.property_id || !form.description) {
        message.warning('Vă rugăm să selectați spațiul și să completați descrierea.');
        return;
      }
      try { 
        await api.post('/maintenance', form); 
        message.success('Solicitare trimisă cu succes.'); 
        showModal.value = false; 
        load(); 
      } catch (e) { 
        message.error(e.response?.data?.message || 'Eroare la trimiterea solicitării.'); 
      }
    };

    onMounted(load);
    return { items, loading, cols, P, MS, showModal, form, propertyOpts, prioOptions, openCreate, save };
  }
};
</script>
