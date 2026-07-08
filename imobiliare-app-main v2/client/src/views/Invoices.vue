<template>
  <div>
    <div class="page-title">Facturi</div>
    <div class="neo-inline-filters mb-3">
      <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="Toate stările" clearable @update:value="load" style="width: 200px;" />
      <span class="spacer"></span>
      <n-button type="primary" :loading="generating" @click="generate">
        <template #icon><n-icon><i class="material-icons">bolt</i></n-icon></template>
        Generează facturi
      </n-button>
    </div>

    <div class="neo-table-card">
      <div v-if="loading" class="text-center py-5"><n-spin size="large" /></div>
      <table v-else class="neo-table">
        <thead>
          <tr>
            <th>Nr. Factură</th>
            <th>Chiriaș</th>
            <th>Data Emiterii</th>
            <th>Scadență</th>
            <th>Total RON</th>
            <th>Stare</th>
            <th style="text-align: right;">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in invoices" :key="item.id">
            <td><span class="code-pill">{{ item.invoice_number }}</span></td>
            <td><strong style="color: white;">{{ item.tenant_name }}</strong></td>
            <td>{{ fmtDate(item.issue_date) }}</td>
            <td>{{ fmtDate(item.due_date) }}</td>
            <td><strong style="color: #34d399;">{{ fmt(item.total_ron) }} RON</strong></td>
            <td>
              <span class="status-chip" :class="item.status === 'PAID' ? 'active' : item.status === 'OVERDUE' ? 'danger' : item.status === 'ISSUED' ? 'info' : ''">
                {{ ST[item.status]?.label || item.status }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="icon-btn" title="Vezi factură" @click="$router.push(`/app/invoices/${item.id}`)"><i class="material-icons" style="font-size:18px">visibility</i></button>
                <button class="icon-btn" title="Descarcă PDF" @click="downloadPdf(item.id, item.invoice_number)"><i class="material-icons" style="font-size:18px">picture_as_pdf</i></button>
                <button v-if="['ISSUED','OVERDUE'].includes(item.status)" class="icon-btn success" title="Marchează plătită" @click="pay(item.id)"><i class="material-icons" style="font-size:18px">paid</i></button>
                <button v-if="item.status !== 'CANCELLED'" class="icon-btn danger" title="Anulează factură" @click="openCancelModal(item.id)"><i class="material-icons" style="font-size:18px">block</i></button>
              </div>
            </td>
          </tr>
          <tr v-if="!invoices.length">
            <td colspan="7" class="text-center py-4" style="color: #64748b;">Nu există facturi generate.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <n-modal v-model:show="showCancelModal" title="Confirmare Anulare Factură" preset="card" style="width: 480px;">
      <div style="font-size: 0.95rem; margin-bottom: 12px;">
        Ești sigur că dorești să anulezi această factură? Această acțiune va schimba starea în <b>Anulată</b> și nu va mai putea fi încasată.
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <n-button @click="showCancelModal = false">Înapoi</n-button>
          <n-button type="error" @click="confirmCancel">Confirmă Anularea</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage, NCard, NDataTable, NButton, NSelect, NModal, NTag, NIcon } from 'naive-ui';
import api from '../services/api';
import { INVOICE_STATUS } from '../services/labels';

export default {
  name: 'Invoices',
  components: { NCard, NDataTable, NButton, NSelect, NModal, NTag, NIcon },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const invoices = ref([]);
    const loading = ref(false);
    const generating = ref(false);
    const statusFilter = ref(null);
    const showCancelModal = ref(false);
    const invoiceToCancel = ref(null);
    const statusTypeMap = { ISSUED: 'info', PAID: 'success', OVERDUE: 'error', CANCELLED: 'default' };
    const ST = INVOICE_STATUS;

    const columns = [
      { title: 'Nr. factură', key: 'invoice_number' },
      { title: 'Chiriaș', key: 'tenant_name' },
      { title: 'Emisă', key: 'issue_date', render(row) { return fmtDate(row.issue_date); } },
      { title: 'Scadență', key: 'due_date', render(row) { return fmtDate(row.due_date); } },
      { title: 'Total', key: 'total_ron', render(row) { return `${fmt(row.total_ron)} RON`; } },
      { title: 'Stare', key: 'status', render(row) { const s = ST[row.status]; return h(NTag, { type: statusTypeMap[row.status] || 'default', size: 'small' }, { default: () => s?.label || row.status }); } },
      { title: 'Acțiuni', key: 'actions', width: 200, render(row) {
        return h('div', { style: 'display: flex; gap: 14px; align-items: center;' }, [
          h(NButton, { text: true, type: 'primary', onClick: () => router.push(`/app/invoices/${row.id}`), title: 'Vezi' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          h(NButton, { text: true, type: 'info', onClick: () => downloadPdf(row.id, row.invoice_number), title: 'Descarcă PDF' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'picture_as_pdf') }) }),
          ...(['ISSUED','OVERDUE'].includes(row.status) ? [h(NButton, { text: true, type: 'success', onClick: () => pay(row.id), title: 'Marchează plătită' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'paid') }) })] : []),
          ...(row.status !== 'CANCELLED' ? [h(NButton, { text: true, type: 'error', onClick: () => openCancelModal(row.id), title: 'Anulează' }, { icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'block') }) })] : []),
        ]);
      }},
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
      try { const r = await api.post('/invoices/generate'); message.success(r.data.message); load(); }
      catch (e) { message.error('Eroare la generare.'); }
      finally { generating.value = false; }
    };
    const pay = async (id) => {
      try { await api.patch(`/invoices/${id}/pay`); message.success('Factură achitată.'); load(); }
      catch (e) { message.error('Eroare.'); }
    };
    const openCancelModal = (id) => {
      invoiceToCancel.value = id;
      showCancelModal.value = true;
    };
    const confirmCancel = async () => {
      if (!invoiceToCancel.value) return;
      showCancelModal.value = false;
      try { await api.patch(`/invoices/${invoiceToCancel.value}/cancel`); message.success('Factură anulată.'); load(); }
      catch (e) { message.error('Eroare la anulare.'); }
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
        message.error('Eroare la descărcarea PDF-ului.');
      }
    };
    onMounted(load);
    return { invoices, loading, generating, statusFilter, statusOptions, columns, fmt, fmtDate, load, generate, pay, openCancelModal, confirmCancel, downloadPdf, showCancelModal, ST };
  }
};
</script>
