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
          <template #cell(period)="{ row }">{{ fmtDate(row.source.start_date) }} → {{ fmtDate(row.source.end_date) }}</template>
          <template #cell(monthly_rent_eur)="{ value }">{{ value }} €</template>
          <template #cell(status)="{ value }">
            <va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" />
          </template>
          <template #cell(actions)="{ row }">
            <va-button v-if="isAdmin && row.source.status === 'DRAFT'" preset="plain" color="success" icon="check_circle" title="Activează" @click="activate(row.source.id)" />
            <va-button v-if="isAdmin && row.source.status === 'ACTIVE'" preset="plain" color="danger" icon="cancel" title="Reziliază" @click="openTerminate(row.source.id)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <va-modal v-model="showTerminateModal" title="Motiv Reziliere Contract" hide-default-actions>
      <div class="modal-form">
        <va-input 
          v-model="terminateReason" 
          type="textarea" 
          label="Motivul complet al rezilierii" 
          class="mb-2 w-100" 
          :min-rows="4"
        />
        <p class="text-danger mt-2" style="font-size: 0.85rem">Atenție: Această acțiune este ireversibilă!</p>
      </div>
      <template #footer>
        <va-button preset="secondary" @click="showTerminateModal = false">Anulează</va-button>
        <va-button class="ml-2" color="danger" @click="confirmTerminate">Confirmă Rezilierea</va-button>
      </template>
    </va-modal>

    <va-modal v-model="showModal" title="Contract nou" hide-default-actions>
      <div class="modal-form">
        <va-select v-model="form.tenant_id" :options="tenantOpts" text-by="label" value-by="value" label="Chiriaș" searchable :virtual-scroller="false" placeholder="Caută chiriaș după nume sau CUI..." class="mb-2" />
        <va-select v-model="form.property_id" :options="propertyOpts" text-by="label" value-by="value" label="Spațiu disponibil" searchable :virtual-scroller="false" placeholder="Caută spațiu după nume sau adresă..." class="mb-2">
          <template #option="{ option, selectOption }">
            <div class="space-option-content" @click="selectOption ? selectOption(option) : (form.property_id = option.value)">
              <div class="space-title">
                <va-icon name="apartment" size="small" color="primary" class="mr-2" />
                <span>{{ option.title || option.label }}</span>
              </div>
              <div class="space-addr" v-if="option.address">
                <va-icon name="location_on" size="small" color="secondary" class="mr-2" />
                <span>{{ option.address }}</span>
              </div>
            </div>
          </template>
        </va-select>
        <div class="row">
          <div class="flex xs6"><va-input v-model="form.start_date" type="date" label="Data început" class="mb-2" /></div>
          <div class="flex xs6"><va-input v-model="form.end_date" type="date" label="Data sfârșit" class="mb-2" /></div>
        </div>
        <div class="row">
          <div class="flex xs6"><va-input v-model.number="form.monthly_rent_eur" type="number" label="Chirie lunară (EUR)" class="mb-2" @update:modelValue="form.deposit_eur = form.monthly_rent_eur * 2" /></div>
          <div class="flex xs6"><va-input v-model.number="form.deposit_eur" type="number" label="Garanție (EUR)" class="mb-2" /></div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
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

    const cols = [
      { key: 'contract_number', label: 'Nr. contract' },
      { key: 'tenant_name', label: 'Chiriaș' },
      { key: 'property_title', label: 'Spațiu' },
      { key: 'period', label: 'Perioadă' },
      { key: 'monthly_rent_eur', label: 'Chirie' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: 'Acțiuni' },
    ];
    const statusOptions = Object.entries(CONTRACT_STATUS)
      .map(([value, v]) => ({ value, label: v.label }));
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
        const cleanAddr = p.address
          .replace(/,\s*Bucure[sș]ti/gi, '')
          .replace(/,\s*Rom[aâ]nia/gi, '')
          .replace(/,\s*Sector\s*\d/gi, '')
          .trim();
        return { 
          value: p.id, 
          label: `🏢 ${p.title}  —  📍 ${cleanAddr}`,
          title: p.title,
          address: cleanAddr 
        };
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
        init({ message: 'Contract creat (ciornă).', color: 'success' });
        showModal.value = false; load();
      } catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
    };
    const activate = async (id) => {
      try { await api.patch(`/contracts/${id}/activate`); init({ message: 'Contract activat.', color: 'success' }); load(); }
      catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
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
        init({ message: 'Motivul este obligatoriu.', color: 'warning' });
        return;
      }
      try { 
        await api.patch(`/contracts/${terminateId.value}/terminate`, { reason: terminateReason.value }); 
        init({ message: 'Contract reziliat.', color: 'success' }); 
        showTerminateModal.value = false;
        load(); 
      }
      catch (e) { init({ message: e.response?.data?.message || 'Eroare.', color: 'danger' }); }
    };

    onMounted(load);
    return { contracts, loading, statusFilter, statusOptions, cols, ST: CONTRACT_STATUS, isAdmin, showModal, form, tenantOpts, propertyOpts, openCreate, save, activate, terminateId, terminateReason, showTerminateModal, openTerminate, confirmTerminate, load, fmtDate };
  }
};
</script>

<style scoped>
.modal-form { min-width: 600px; max-width: 100%; }
:deep(.va-select-option:has(.space-option-content)),
:deep(.va-select-option) {
  padding: 2px !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}
.space-option-content {
  width: 100%;
  padding: 10px 14px !important;
  margin: 6px 0 !important;
  background: #ffffff !important;
  border: 1.5px solid #64748b !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08) !important;
  display: flex;
  flex-direction: column;
  gap: 6px;
  line-height: 1.4;
  white-space: normal;
  word-wrap: break-word;
  cursor: pointer;
  transition: all 0.2s ease;
}
.space-option-content:hover {
  border-color: #2563eb !important;
  background: #eff6ff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18) !important;
}
.space-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f172a;
  display: flex;
  align-items: center;
}
.space-addr {
  font-size: 0.85rem;
  color: #475569;
  display: flex;
  align-items: flex-start;
  line-height: 1.35;
}
</style>
