<template>
  <div>
    <div class="page-title">Contracte</div>
    <div class="neo-inline-filters mb-3">
      <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="Toate stările" clearable @update:value="load" style="width: 200px;" />
      <span class="spacer"></span>
      <n-button v-if="isAdmin" type="primary" @click="openCreate">
        <template #icon><n-icon><i class="material-icons">add</i></n-icon></template>
        Contract nou
      </n-button>
    </div>

    <div class="neo-table-card">
      <div v-if="loading" class="text-center py-5"><n-spin size="large" /></div>
      <table v-else class="neo-table">
        <thead>
          <tr>
            <th>Nr. Contract</th>
            <th>Chiriaș</th>
            <th>Spațiu Închiriat</th>
            <th>Perioadă Contractuală</th>
            <th>Chirie Lunară</th>
            <th>Stare</th>
            <th style="text-align: right;">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in contracts" :key="item.id">
            <td><span class="code-pill">{{ item.contract_number || 'DRAFT' }}</span></td>
            <td><strong style="color: white;">{{ item.tenant_name }}</strong></td>
            <td>{{ item.property_title }}</td>
            <td>
              <div>{{ fmtDate(item.start_date) }} → {{ fmtDate(item.end_date) }}</div>
              <div class="progress-mini"><div class="fill" style="width: 60%;"></div></div>
            </td>
            <td><strong style="color: #34d399;">{{ item.monthly_rent_eur }} €</strong></td>
            <td>
              <span class="status-chip" :class="item.status === 'ACTIVE' ? 'active' : item.status === 'DRAFT' ? 'pending' : 'danger'">
                {{ ST[item.status]?.label || item.status }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="icon-btn" title="Vizualizare contract" @click="openViewModal(item)"><i class="material-icons" style="font-size:18px">visibility</i></button>
                <button class="icon-btn" title="Descarcă PDF" @click="downloadPdf(item.id, item.contract_number)"><i class="material-icons" style="font-size:18px">picture_as_pdf</i></button>
                <button v-if="isAdmin && item.status === 'DRAFT'" class="icon-btn success" title="Activează contract" @click="activate(item.id)"><i class="material-icons" style="font-size:18px">check_circle</i></button>
                <button v-if="isAdmin && item.status === 'ACTIVE'" class="icon-btn danger" title="Reziliază contract" @click="openTerminate(item.id)"><i class="material-icons" style="font-size:18px">cancel</i></button>
              </div>
            </td>
          </tr>
          <tr v-if="!contracts.length">
            <td colspan="7" class="text-center py-4" style="color: #64748b;">Nu există contracte înregistrate.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <n-modal v-model:show="showViewModal" title="Detalii Contract de Închiriere" preset="card" style="width: 700px;">
      <div v-if="selectedContract">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <n-form-item label="Număr Contract"><n-input :value="selectedContract.contract_number || 'DRAFT'" readonly /></n-form-item>
          <n-form-item label="Stare Contract"><n-input :value="ST[selectedContract.status]?.label || selectedContract.status" readonly /></n-form-item>
        </div>
        <n-form-item label="Chiriaș (Titular)"><n-input :value="selectedContract.tenant_name || 'N/A'" readonly /></n-form-item>
        <n-form-item label="Spațiu închiriat"><n-input :value="selectedContract.property_title || 'N/A'" readonly /></n-form-item>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <n-form-item label="Data Început"><n-input :value="fmtDate(selectedContract.start_date)" readonly /></n-form-item>
          <n-form-item label="Data Expirare"><n-input :value="fmtDate(selectedContract.end_date)" readonly /></n-form-item>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <n-form-item label="Chirie lunară"><n-input :value="(selectedContract.monthly_rent_eur || 0) + ' €'" readonly /></n-form-item>
          <n-form-item label="Garanție"><n-input :value="(selectedContract.deposit_eur || 0) + ' €'" readonly /></n-form-item>
          <n-form-item label="Zi de facturare"><n-input :value="`Ziua ${selectedContract.billing_day || 1}`" readonly /></n-form-item>
        </div>
        <div v-if="selectedContract.status === 'TERMINATED' && selectedContract.termination_reason">
          <n-form-item label="Motiv Reziliere"><n-input :value="selectedContract.termination_reason" readonly type="textarea" /></n-form-item>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <n-button type="info" @click="downloadPdf(selectedContract.id, selectedContract.contract_number)">
            <template #icon><n-icon><i class="material-icons">picture_as_pdf</i></n-icon></template>
            Descarcă PDF
          </n-button>
          <n-button @click="showViewModal = false">Închide</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showTerminateModal" title="Motiv Reziliere Contract" preset="card" style="width: 500px;">
      <n-form-item label="Motivul complet al rezilierii">
        <n-input v-model:value="terminateReason" type="textarea" :rows="4" />
      </n-form-item>
      <p style="color: #ef4444; font-size: 0.85rem;">Atenție: Această acțiune este ireversibilă!</p>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <n-button @click="showTerminateModal = false">Anulează</n-button>
          <n-button type="error" @click="confirmTerminate">Confirmă Rezilierea</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showModal" title="Contract nou" preset="card" style="width: 700px;">
      <n-form-item label="Chiriaș">
        <n-select v-model:value="form.tenant_id" :options="tenantOpts" filterable placeholder="Caută chiriaș după nume sau CUI..." />
      </n-form-item>
      <n-form-item label="Spațiu disponibil">
        <n-select v-model:value="form.property_id" :options="propertyOpts" filterable placeholder="Caută spațiu după nume sau adresă..." />
      </n-form-item>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <n-form-item label="Data început"><n-input v-model:value="form.start_date" type="text" placeholder="YYYY-MM-DD" /></n-form-item>
        <n-form-item label="Data sfârșit"><n-input v-model:value="form.end_date" type="text" placeholder="YYYY-MM-DD" /></n-form-item>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <n-form-item label="Chirie lunară (EUR)"><n-input-number v-model:value="form.monthly_rent_eur" :min="0" @update:value="v => form.deposit_eur = v * 2" /></n-form-item>
        <n-form-item label="Garanție (EUR)"><n-input-number v-model:value="form.deposit_eur" :min="0" /></n-form-item>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <n-button @click="showModal = false">Anulează</n-button>
          <n-button type="primary" @click="save">Salvează contract</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch, h } from 'vue';
import { useStore } from 'vuex';
import { useMessage, NCard, NDataTable, NButton, NSelect, NModal, NTag, NInput, NInputNumber, NFormItem, NIcon } from 'naive-ui';
import api from '../services/api';
import { CONTRACT_STATUS } from '../services/labels';

export default {
  name: 'Contracts',
  components: { NCard, NDataTable, NButton, NSelect, NModal, NTag, NInput, NInputNumber, NFormItem, NIcon },
  setup() {
    const store = useStore();
    const message = useMessage();
    const contracts = ref([]);
    const loading = ref(false);
    const statusFilter = ref(null);
    const showModal = ref(false);
    const form = reactive({ billing_day: new Date().getDate(), deposit_eur: 0, utilities_ron: 0, start_date: '', end_date: '' });
    
    watch(() => form.start_date, (newDate) => {
      if (newDate) {
        const dateObj = new Date(newDate);
        if (!isNaN(dateObj.getTime())) {
          dateObj.setFullYear(dateObj.getFullYear() + 1);
          form.end_date = dateObj.toISOString().split('T')[0];
          form.billing_day = Math.min(28, dateObj.getDate());
        }
      }
    });
    const tenantOpts = ref([]);
    const propertyOpts = ref([]);
    const rawProperties = ref([]);

    watch(() => form.property_id, (newVal) => {
      if (!newVal) return;
      const prop = rawProperties.value.find(p => p.id === newVal);
      if (prop && prop.price !== undefined && prop.price !== null) {
        const priceNum = Number(prop.price) || 0;
        form.monthly_rent_eur = priceNum;
        form.deposit_eur = priceNum * 2;
      }
    });

    const isAdmin = computed(() => store.getters.isAdmin);
    const ST = CONTRACT_STATUS;
    const statusTypeMap = { DRAFT: 'warning', ACTIVE: 'success', TERMINATED: 'error', EXPIRED: 'default' };

    const columns = computed(() => [
      { title: 'Nr. contract', key: 'contract_number' },
      { title: 'Chiriaș', key: 'tenant_name' },
      { title: 'Spațiu', key: 'property_title' },
      { title: 'Perioadă', key: 'period', render(row) { return `${fmtDate(row.start_date)} → ${fmtDate(row.end_date)}`; } },
      { title: 'Chirie', key: 'monthly_rent_eur', render(row) { return `${row.monthly_rent_eur} €`; } },
      { title: 'Stare', key: 'status', render(row) { const s = ST[row.status]; return h(NTag, { type: statusTypeMap[row.status] || 'default', size: 'small' }, { default: () => s?.label || row.status }); } },
      { title: 'Acțiuni', key: 'actions', width: 200, render(row) {
        return h('div', { style: 'display: flex; gap: 14px; align-items: center;' }, [
          h(NButton, { text: true, type: 'primary', onClick: () => openViewModal(row), title: 'Vizualizare contract' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          h(NButton, { text: true, type: 'info', onClick: () => downloadPdf(row.id, row.contract_number), title: 'Descarcă PDF' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'picture_as_pdf') }) }),
          ...(isAdmin.value && row.status === 'DRAFT' ? [h(NButton, { text: true, type: 'success', onClick: () => activate(row.id), title: 'Activează' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'check_circle') }) })] : []),
          ...(isAdmin.value && row.status === 'ACTIVE' ? [h(NButton, { text: true, type: 'error', onClick: () => openTerminate(row.id), title: 'Reziliază' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'cancel') }) })] : []),
        ]);
      }},
    ]);

    const statusOptions = Object.entries(CONTRACT_STATUS).map(([value, v]) => ({ value, label: v.label }));
    const fmtDate = (d) => {
      if (!d) return '';
      return new Date(d).toLocaleString('ro-RO');
    };

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
      form.billing_day = Math.min(28, new Date().getDate()); form.deposit_eur = 0; form.utilities_ron = 0; form.monthly_rent_eur = 0;
      const tenants = (await api.get('/tenants')).data.filter(t => t.status !== 'OVERDUE');
      tenantOpts.value = tenants.map(t => ({ value: t.id, label: `👤 ${t.company_name}  —  CUI: ${t.cui}` }));
      const props = (await api.get('/properties', { params: { status: 'FREE' } })).data;
      rawProperties.value = props;
      propertyOpts.value = props.map(p => {
        const cleanAddr = p.address.replace(/,\s*Bucure[sș]ti/gi, '').replace(/,\s*Rom[aâ]nia/gi, '').replace(/,\s*Sector\s*\d/gi, '').trim();
        return { value: p.id, label: `🏢 ${p.title}  —  📍 ${cleanAddr}` };
      });
      showModal.value = true;
    };
    const save = async () => {
      try {
        if (!form.billing_day) {
          form.billing_day = form.start_date ? Math.min(28, new Date(form.start_date).getDate()) : Math.min(28, new Date().getDate());
        }
        form.utilities_ron = 0;
        await api.post('/contracts', form);
        message.success('Contract creat (ciornă).');
        showModal.value = false; load();
      } catch (e) { message.error(e.response?.data?.message || 'Eroare.'); }
    };
    const activate = async (id) => {
      try { await api.patch(`/contracts/${id}/activate`); message.success('Contract activat.'); load(); }
      catch (e) { message.error(e.response?.data?.message || 'Eroare.'); }
    };
    const terminateId = ref(null);
    const terminateReason = ref('');
    const showTerminateModal = ref(false);

    const openTerminate = (id) => {
      terminateId.value = id;
      terminateReason.value = '';
      showTerminateModal.value = true;
    };

    const confirmTerminate = async () => {
      if (!terminateReason.value.trim()) {
        message.warning('Motivul este obligatoriu.');
        return;
      }
      try { 
        await api.patch(`/contracts/${terminateId.value}/terminate`, { reason: terminateReason.value }); 
        message.success('Contract reziliat.'); 
        showTerminateModal.value = false;
        load(); 
      }
      catch (e) { message.error(e.response?.data?.message || 'Eroare.'); }
    };

    const downloadPdf = async (id, ctrNumber) => {
      try {
        const res = await api.get(`/contracts/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `contract-${ctrNumber || 'draft'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (e) {
        message.error('Eroare la descărcarea PDF-ului');
      }
    };

    const showViewModal = ref(false);
    const selectedContract = ref(null);
    const openViewModal = (contract) => {
      selectedContract.value = contract;
      showViewModal.value = true;
    };

    onMounted(load);
    return { contracts, loading, statusFilter, statusOptions, columns, ST, isAdmin, showModal, form, tenantOpts, propertyOpts, openCreate, save, activate, terminateId, terminateReason, showTerminateModal, openTerminate, confirmTerminate, load, fmtDate, downloadPdf, showViewModal, selectedContract, openViewModal };
  }
};
</script>
