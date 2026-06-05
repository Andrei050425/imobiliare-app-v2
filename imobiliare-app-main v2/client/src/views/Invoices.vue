<template>
  <div>
    <div class="page-title">Facturi</div>
    <div class="toolbar">
      <va-select v-model="statusFilter" :options="statusOptions" text-by="label" value-by="value" placeholder="Toate stările" clearable @update:modelValue="load" />
      <span class="spacer"></span>
      <va-button icon="bolt" @click="generate" :loading="generating">Generează facturi</va-button>
    </div>

    <va-card>
      <va-card-content>
        <va-data-table :items="invoices" :columns="cols" :loading="loading">
          <template #cell(issue_date)="{ value }">{{ fmtDate(value) }}</template>
          <template #cell(due_date)="{ value }">{{ fmtDate(value) }}</template>
          <template #cell(total_ron)="{ value }">{{ fmt(value) }} RON</template>
          <template #cell(status)="{ value }">
            <va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" />
          </template>
          <template #cell(actions)="{ row }">
            <va-button preset="plain" icon="visibility" title="Vezi" @click="$router.push(`/app/invoices/${row.source.id}`)" />
            <va-button preset="plain" color="info" icon="picture_as_pdf" title="Descarcă PDF" @click="downloadPdf(row.source.id, row.source.invoice_number)" />
            <va-button v-if="['ISSUED','OVERDUE'].includes(row.source.status)" preset="plain" color="success" icon="paid" title="Marchează plătită" @click="pay(row.source.id)" />
            <va-button v-if="row.source.status !== 'CANCELLED'" preset="plain" color="danger" icon="block" title="Anulează" @click="cancel(row.source.id)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'vuestic-ui';
import api from '../services/api';
import { INVOICE_STATUS } from '../services/labels';

export default {
  name: 'Invoices',
  setup() {
    const { init } = useToast();
    const invoices = ref([]);
    const loading = ref(false);
    const generating = ref(false);
    const statusFilter = ref(null);
    const cols = [
      { key: 'invoice_number', label: 'Nr. factură' },
      { key: 'tenant_name', label: 'Chiriaș' },
      { key: 'issue_date', label: 'Emisă' },
      { key: 'due_date', label: 'Scadență' },
      { key: 'total_ron', label: 'Total' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: 'Acțiuni' },
    ];
    const statusOptions = Object.entries(INVOICE_STATUS).map(([value, v]) => ({ value, label: v.label }));
    const fmt = (n) => Number(n || 0).toLocaleString('ro-RO');
    const fmtDate = (d) => {
      if (!d) return '';
      return new Date(d).toLocaleString('ro-RO');
    };
    const load = async () => {
      loading.value = true;
      try {
        const params = {};
        if (statusFilter.value) params.status = statusFilter.value;
        invoices.value = (await api.get('/invoices', { params })).data;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };
    const generate = async () => {
      generating.value = true;
      try { const r = await api.post('/invoices/generate'); init({ message: r.data.message, color: 'success' }); load(); }
      catch (e) { init({ message: 'Eroare la generare.', color: 'danger' }); }
      finally { generating.value = false; }
    };
    const pay = async (id) => {
      try { await api.patch(`/invoices/${id}/pay`); init({ message: 'Factură achitată.', color: 'success' }); load(); }
      catch (e) { init({ message: 'Eroare.', color: 'danger' }); }
    };
    const cancel = async (id) => {
      if (!confirm('Anulezi factura?')) return;
      try { await api.patch(`/invoices/${id}/cancel`); init({ message: 'Factură anulată.', color: 'success' }); load(); }
      catch (e) { init({ message: 'Eroare.', color: 'danger' }); }
    };
    const downloadPdf = async (id, invNumber) => {
      try {
        const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `factura-${invNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        init({ message: 'Eroare la descărcarea PDF-ului.', color: 'danger' });
      }
    };
    onMounted(load);
    return { invoices, loading, generating, statusFilter, statusOptions, cols, ST: INVOICE_STATUS, fmt, fmtDate, load, generate, pay, cancel, downloadPdf };
  }
};
</script>
