/**
 * Serviciu de generare a facturilor.
 * Conține logica de business folosită atât de jobul automat (cron),
 * cât și de generarea manuală din interfață.
 */
const { getEurRonRate } = require("../utils/bnr");

const VAT_RATE = 0.19; // cota TVA implicită

/**
 * Generează numărul de factură: SANTA-AAAA-NNNN (secvențial pe an).
 */
async function nextInvoiceNumber(knex, year) {
  const prefix = `SANTA-${year}-`;
  const last = await knex("invoices")
    .where("invoice_number", "like", `${prefix}%`)
    .orderBy("invoice_number", "desc")
    .first();
  let seq = 1;
  if (last) {
    const n = parseInt(last.invoice_number.split("-")[2], 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return prefix + String(seq).padStart(4, "0");
}

/**
 * Creează o factură pentru un contract, pentru o anumită perioadă (lună).
 * Nu generează duplicat dacă există deja o factură pentru aceeași perioadă.
 * Returnează factura creată sau null dacă există deja.
 */
async function generateInvoiceForContract(knex, contract, options = {}) {
  const now = options.date ? new Date(options.date) : new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  const periodStart = new Date(year, month, 1);
  const periodEnd = new Date(year, month + 1, 0);

  // Evităm dublarea: există deja factură pentru această perioadă?
  const existing = await knex("invoices")
    .where({ contract_id: contract.id })
    .andWhere("period_start", periodStart.toISOString().slice(0, 10))
    .first();
  if (existing) return null;

  const rate = await getEurRonRate();
  const rentEur = parseFloat(contract.monthly_rent_eur);
  const rentRon = parseFloat((rentEur * rate).toFixed(2));
  const utilitiesRon = parseFloat(contract.utilities_ron || 0);
  const base = rentRon + utilitiesRon;
  const vatRon = parseFloat((base * VAT_RATE).toFixed(2));
  const totalRon = parseFloat((base + vatRon).toFixed(2));

  const issueDate = now.toISOString().slice(0, 10);
  const dueDate = new Date(year, month, now.getDate() + 15)
    .toISOString()
    .slice(0, 10);

  const invoiceNumber = await nextInvoiceNumber(knex, year);

  const [invoice] = await knex("invoices")
    .insert({
      invoice_number: invoiceNumber,
      contract_id: contract.id,
      issue_date: issueDate,
      due_date: dueDate,
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      rent_eur: rentEur,
      bnr_rate: rate,
      rent_ron: rentRon,
      utilities_ron: utilitiesRon,
      vat_ron: vatRon,
      total_ron: totalRon,
      status: "ISSUED",
    })
    .returning("*");

  return invoice;
}

/**
 * Generează facturi pentru toate contractele ACTIVE.
 * Returnează numărul de facturi create.
 */
async function generateMonthlyInvoices(knex, options = {}) {
  const contracts = await knex("contracts").where({ status: "ACTIVE" });
  let created = 0;
  for (const contract of contracts) {
    const inv = await generateInvoiceForContract(knex, contract, options);
    if (inv) created++;
  }
  return created;
}

/**
 * Verifică scadențele: facturile ISSUED depășite cu > graceDays trec în OVERDUE,
 * iar chiriașii aferenți devin OVERDUE. Returnează numărul de facturi actualizate.
 */
async function markOverdueInvoices(knex, graceDays = 5) {
  const limit = new Date();
  limit.setDate(limit.getDate() - graceDays);
  const limitStr = limit.toISOString().slice(0, 10);

  const overdue = await knex("invoices")
    .where({ status: "ISSUED" })
    .andWhere("due_date", "<", limitStr);

  for (const inv of overdue) {
    await knex("invoices").where({ id: inv.id }).update({ status: "OVERDUE" });
    // Marcăm chiriașul ca OVERDUE
    const contract = await knex("contracts")
      .where({ id: inv.contract_id })
      .first();
    if (contract) {
      await knex("tenants")
        .where({ id: contract.tenant_id })
        .update({ status: "OVERDUE" });
    }
  }
  return overdue.length;
}

module.exports = {
  VAT_RATE,
  nextInvoiceNumber,
  generateInvoiceForContract,
  generateMonthlyInvoices,
  markOverdueInvoices,
};
