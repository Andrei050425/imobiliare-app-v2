<template>
  <div>
    <div class="page-title">Facturile mele</div>
    <div class="neo-table-card">
      <div v-if="loading" class="text-center py-5"><n-spin size="large" /></div>
      <table v-else class="neo-table">
        <thead>
          <tr>
            <th>Nr. Factură</th>
            <th>Data Emiterii</th>
            <th>Scadență</th>
            <th>Total RON</th>
            <th>Stare</th>
            <th style="text-align: right;">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td><span class="code-pill">{{ item.invoice_number }}</span></td>
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
                <button class="icon-btn" title="Descarcă PDF" @click="downloadPdf(item.id, item.invoice_number)"><i class="material-icons" style="font-size:18px">picture_as_pdf</i></button>
              </div>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="6" class="text-center py-4" style="color: #64748b;">Nu ai nicio factură emisă.</td>
          </tr>
        </tbody>
      </table>
    </div>
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

    const fmtDate = (d) => {
      if (!d) return '';
      return new Date(d).toLocaleDateString('ro-RO');
    };

    return { items, loading, cols, fmt, fmtDate, ST, downloadPdf };
  }
};
</script>
