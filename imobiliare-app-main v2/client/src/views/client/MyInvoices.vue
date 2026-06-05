<template>
  <div>
    <div class="page-title">Facturile mele</div>
    <va-card>
      <va-card-content>
        <va-data-table :items="items" :columns="cols" :loading="loading" no-data-html="Nu ai facturi.">
          <template #cell(total_ron)="{ value }">{{ fmt(value) }} RON</template>
          <template #cell(status)="{ value }"><va-badge :color="ST[value]?.color" :text="ST[value]?.label || value" /></template>
          <template #cell(actions)="{ row }">
            <va-button preset="plain" icon="visibility" title="Vizualizare" @click="$router.push(`/app/invoices/${row.source.id}`)" />
            <va-button preset="plain" color="info" icon="picture_as_pdf" title="Descarcă PDF" @click="downloadPdf(row.source.id, row.source.invoice_number)" />
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import { INVOICE_STATUS } from '../../services/labels';
export default {
  name: 'MyInvoices',
  setup() {
    const items = ref([]); const loading = ref(true);
    const fmt = (n) => Number(n || 0).toLocaleString('ro-RO');
    const cols = [
      { key: 'invoice_number', label: 'Nr. factură' },
      { key: 'issue_date', label: 'Emisă' },
      { key: 'due_date', label: 'Scadență' },
      { key: 'total_ron', label: 'Total' },
      { key: 'status', label: 'Stare' },
      { key: 'actions', label: 'Acțiuni' },
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

    return { items, loading, cols, fmt, ST: INVOICE_STATUS, downloadPdf };
  }
};
</script>
