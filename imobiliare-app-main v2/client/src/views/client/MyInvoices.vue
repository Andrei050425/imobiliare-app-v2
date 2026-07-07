<template>
  <div>
    <div class="page-title">Facturile mele</div>
    <n-card :bordered="true">
      <n-data-table :data="items" :columns="cols" :loading="loading" :bordered="false" />
    </n-card>
  </div>
</template>

<script>
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NDataTable, NButton, NTag, NIcon } from 'naive-ui';
import api from '../../services/api';
import { INVOICE_STATUS } from '../../services/labels';

export default {
  name: 'MyInvoices',
  components: { NCard, NDataTable, NButton, NTag, NIcon },
  setup() {
    const items = ref([]); 
    const loading = ref(true);
    const router = useRouter();
    const fmt = (n) => Number(n || 0).toLocaleString('ro-RO');
    const ST = INVOICE_STATUS;
    const statusTypeMap = { ISSUED: 'info', PAID: 'success', OVERDUE: 'error', CANCELLED: 'default' };

    const cols = [
      { key: 'invoice_number', title: 'Nr. factură' },
      { key: 'issue_date', title: 'Emisă', render(row) { return new Date(row.issue_date).toLocaleDateString('ro-RO'); } },
      { key: 'due_date', title: 'Scadență', render(row) { return new Date(row.due_date).toLocaleDateString('ro-RO'); } },
      { key: 'total_ron', title: 'Total', render(row) { return `${fmt(row.total_ron)} RON`; } },
      { key: 'status', title: 'Stare', render(row) { const s = ST[row.status]; return h(NTag, { type: statusTypeMap[row.status] || 'default', size: 'small' }, { default: () => s?.label || row.status }); } },
      { key: 'actions', title: 'Acțiuni', width: 160, render(row) {
        return h('div', { style: 'display: flex; gap: 10px; align-items: center;' }, [
          h(NButton, { size: 'small', type: 'primary', secondary: true, onClick: () => router.push(`/app/invoices/${row.id}`), title: 'Vizualizare' }, { default: () => 'Vezi', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'visibility') }) }),
          h(NButton, { size: 'small', type: 'info', secondary: true, onClick: () => downloadPdf(row.id, row.invoice_number), title: 'Descarcă PDF' }, { default: () => 'PDF', icon: () => h(NIcon, null, { default: () => h('i', { class: 'material-icons' }, 'picture_as_pdf') }) }),
        ]);
      }},
    ];

    onMounted(async () => {
      try { items.value = (await api.get('/invoices/mine')).data; } catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    
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
        alert('Eroare la descărcarea fișierului PDF.');
      }
    };

    return { items, loading, cols, fmt, ST, downloadPdf };
  }
};
</script>
