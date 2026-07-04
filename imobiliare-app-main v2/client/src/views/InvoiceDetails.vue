<template>
  <div>
    <div class="toolbar">
      <va-button preset="secondary" icon="arrow_back" @click="$router.back()">Înapoi</va-button>
      <span class="spacer"></span>
    </div>

    <div v-if="loading" class="text-center"><va-progress-circle indeterminate /></div>

    <div v-else-if="inv" class="invoice-sheet" id="invoice-sheet">
      <div class="inv-head">
        <div>
          <h2>SC SANTA SRL</h2>
          <div class="muted">CUI: RO12345678 · J40/1234/2009</div>
          <div class="muted">Splaiul Independenței 144, București</div>
        </div>
        <div class="text-right">
          <h1>FACTURĂ</h1>
          <div>{{ inv.invoice_number }}</div>
          <div class="muted">Emisă: {{ inv.issue_date }}</div>
          <div class="muted">Scadență: {{ inv.due_date }}</div>
        </div>
      </div>

      <div class="inv-parties">
        <div>
          <div class="lbl">Client</div>
          <div><strong>{{ inv.tenant_name }}</strong></div>
          <div class="muted">CUI: {{ inv.tenant_cui }}</div>
          <div class="muted">{{ inv.tenant_address }}</div>
        </div>
        <div>
          <div class="lbl">Contract</div>
          <div>{{ inv.contract_number }}</div>
          <div class="muted">{{ inv.property_title }}</div>
          <div class="muted">Perioadă: {{ inv.period_start }} – {{ inv.period_end }}</div>
        </div>
      </div>

      <table class="inv-table">
        <thead><tr><th>Denumire</th><th class="r">Valoare</th></tr></thead>
        <tbody>
          <tr><td>Chirie ({{ inv.rent_eur }} € × curs BNR {{ inv.bnr_rate }})</td><td class="r">{{ fmt(inv.rent_ron) }} RON</td></tr>
          <tr v-if="inv.utilities_ron && inv.utilities_ron > 0"><td>Utilități</td><td class="r">{{ fmt(inv.utilities_ron) }} RON</td></tr>
          <tr><td>TVA ({{ vatPercent }}%)</td><td class="r">{{ fmt(inv.vat_ron) }} RON</td></tr>
          <tr v-if="inv.penalty_ron > 0" style="color: var(--va-danger); font-weight: 600;"><td>Penalități de întârziere (1% / zi)</td><td class="r">+{{ fmt(inv.penalty_ron) }} RON</td></tr>
        </tbody>
        <tfoot><tr><td class="total">TOTAL DE PLATĂ</td><td class="r total">{{ fmt(inv.total_ron) }} RON</td></tr></tfoot>
      </table>

      <div class="inv-status">Stare: <va-badge :color="ST[inv.status]?.color" :text="ST[inv.status]?.label || inv.status" /></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';
import { INVOICE_STATUS } from '../services/labels';

export default {
  name: 'InvoiceDetails',
  setup() {
    const route = useRoute();
    const inv = ref(null);
    const loading = ref(true);
    const fmt = (n) => Number(n || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 });
    onMounted(async () => {
      try { inv.value = (await api.get(`/invoices/${route.params.id}`)).data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });

    const vatPercent = computed(() => {
      if (!inv.value) return 21;
      const baseSum = parseFloat(inv.value.rent_ron) + parseFloat(inv.value.utilities_ron);
      const vatRon = parseFloat(inv.value.vat_ron);
      return baseSum > 0 ? Math.round((vatRon / baseSum) * 100) : 21;
    });

    return { inv, loading, fmt, vatPercent, ST: INVOICE_STATUS };
  }
};
</script>

<style scoped>
.invoice-sheet { background: #fff; max-width: 800px; margin: 0 auto; padding: 40px; border-radius: 8px; box-shadow: 0 1px 6px rgba(0,0,0,.08); }
.inv-head { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 16px; }
.inv-head h1 { margin: 0; color: var(--va-primary); }
.inv-head h2 { margin: 0; }
.muted { color: #6b7280; font-size: .9rem; }
.text-right { text-align: right; }
.inv-parties { display: flex; justify-content: space-between; gap: 24px; margin: 24px 0; }
.lbl { text-transform: uppercase; font-size: .75rem; color: #9ca3af; margin-bottom: 4px; }
.inv-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
.inv-table th, .inv-table td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
.inv-table .r { text-align: right; }
.inv-table .total { font-weight: 700; font-size: 1.1rem; }
.inv-status { margin-top: 20px; }
@media print { .toolbar { display: none; } .invoice-sheet { box-shadow: none; } }
</style>
