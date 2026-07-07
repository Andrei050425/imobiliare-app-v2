<template>
  <div>
    <div class="page-title">Chiriași</div>
    <div class="toolbar">
      <n-input v-model:value="search" placeholder="Caută după denumire sau CUI..." clearable @clear="load" @keyup.enter="load" style="max-width: 300px;">
        <template #prefix><n-icon><i class="material-icons" style="font-size:16px">search</i></n-icon></template>
      </n-input>
      <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="Toate stările" clearable @update:value="load" style="width: 180px;" />
      <span class="spacer"></span>
      <n-button v-if="isAdmin" type="primary" @click="openCreate">
        <template #icon><n-icon><i class="material-icons">add</i></n-icon></template>
        Chiriaș nou
      </n-button>
    </div>

    <n-card>
      <n-data-table :columns="columns" :data="tenants" :loading="loading" :bordered="false" />
    </n-card>

    <n-modal v-model:show="showModal" :title="editing ? 'Editează chiriaș' : 'Chiriaș nou'" preset="card" style="width: 500px;">
      <n-form-item label="Denumire firmă"><n-input v-model:value="form.company_name" /></n-form-item>
      <n-form-item label="CUI"><n-input v-model:value="form.cui" :disabled="editing" /></n-form-item>
      <n-form-item label="Nr. Reg. Comerțului"><n-input v-model:value="form.reg_no" /></n-form-item>
      <n-form-item label="Adresă"><n-input v-model:value="form.address" /></n-form-item>
      <n-form-item label="Email"><n-input v-model:value="form.email" /></n-form-item>
      <n-form-item label="Telefon"><n-input v-model:value="form.phone" /></n-form-item>
      <n-form-item label="Reprezentant legal"><n-input v-model:value="form.legal_rep_name" /></n-form-item>
      <n-form-item v-if="editing" label="Stare"><n-select v-model:value="form.status" :options="statusOptions" /></n-form-item>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <n-button @click="showModal = false">Anulează</n-button>
          <n-button type="primary" @click="save">Salvează</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showDetailsModal" title="Detalii Chiriaș" preset="card" style="width: 500px;">
      <div v-if="detailsTenant">
        <n-form-item label="Denumire firmă"><n-input :value="detailsTenant.company_name" readonly /></n-form-item>
        <n-form-item label="CUI"><n-input :value="detailsTenant.cui" readonly /></n-form-item>
        <n-form-item label="Nr. Reg. Comerțului"><n-input :value="detailsTenant.reg_no || '-'" readonly /></n-form-item>
        <n-form-item label="Adresă"><n-input :value="detailsTenant.address || '-'" readonly /></n-form-item>
        <n-form-item label="Email"><n-input :value="detailsTenant.email || '-'" readonly /></n-form-item>
        <n-form-item label="Telefon"><n-input :value="detailsTenant.phone || '-'" readonly /></n-form-item>
        <n-form-item label="Reprezentant legal"><n-input :value="detailsTenant.legal_rep_name || '-'" readonly /></n-form-item>
        <div style="margin-top: 12px;">
          <span style="color: #6366f1; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Stare curentă:</span>
          <n-tag :type="statusTypeMap[detailsTenant.status] || 'default'" size="small" style="margin-left: 8px;">{{ ST[detailsTenant.status]?.label || detailsTenant.status }}</n-tag>
        </div>
      </div>
      <template #footer>
        <n-button @click="showDetailsModal = false">Închide</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useStore } from 'vuex';
import { useMessage, NCard, NDataTable, NButton, NInput, NSelect, NModal, NTag, NFormItem, NIcon } from 'naive-ui';
import api from '../services/api';
import { TENANT_STATUS } from '../services/labels';

export default {
  name: 'Tenants',
  components: { NCard, NDataTable, NButton, NInput, NSelect, NModal, NTag, NFormItem, NIcon },
  setup() {
    const store = useStore();
    const message = useMessage();
    const tenants = ref([]);
    const loading = ref(false);
    const search = ref('');
    const statusFilter = ref(null);
    const showModal = ref(false);
    const showDetailsModal = ref(false);
    const detailsTenant = ref(null);
    const editing = ref(false);
    const form = reactive({});
    const isAdmin = computed(() => store.getters.isAdmin);
    const ST = TENANT_STATUS;
    const statusTypeMap = { ACTIVE: 'success', INACTIVE: 'default', OVERDUE: 'error' };

    const columns = computed(() => [
      { title: 'Denumire', key: 'company_name' },
      { title: 'CUI', key: 'cui' },
      { title: 'Email', key: 'email' },
      { title: 'Telefon', key: 'phone' },
      { title: 'Stare', key: 'status', render(row) { const s = ST[row.status]; return h(NTag, { type: statusTypeMap[row.status] || 'default', size: 'small' }, { default: () => s?.label || row.status }); } },
      { title: 'Acțiuni', key: 'actions', width: 160, render(row) {
        return h('div', { style: 'display: flex; gap: 14px; align-items: center;' }, [
          h(NButton, { text: true, type: 'primary', onClick: () => openDetails(row), title: 'Detalii' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          ...(isAdmin.value ? [
            h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row), title: 'Editează' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'edit') }) }),
            h(NButton, { text: true, type: 'error', onClick: () => deleteTenant(row.id), title: 'Șterge' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'delete') }) }),
          ] : []),
        ]);
      }},
    ]);
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
    const openDetails = (t) => { detailsTenant.value = t; showDetailsModal.value = true; };
    const save = async () => {
      try {
        if (editing.value) await api.put(`/tenants/${form.id}`, form);
        else await api.post('/tenants', form);
        message.success('Salvat cu succes.');
        showModal.value = false;
        load();
      } catch (e) { message.error(e.response?.data?.message || 'Eroare.'); }
    };
    const deleteTenant = async (id) => {
      if (!confirm('Ești sigur că vrei să ștergi acest chiriaș? Toate contractele asociate vor fi de asemenea șterse!')) return;
      try {
        await api.delete(`/tenants/${id}`);
        message.success('Chiriaș șters cu succes.');
        load();
      } catch (e) {
        message.error(e.response?.data?.message || 'Eroare la ștergere.');
      }
    };

    onMounted(load);
    return { tenants, loading, search, statusFilter, statusOptions, columns, ST, statusTypeMap, isAdmin, showModal, showDetailsModal, detailsTenant, editing, form, openCreate, openEdit, openDetails, save, deleteTenant, load };
  }
};
</script>
