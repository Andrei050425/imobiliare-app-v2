/**
 * Sarcini programate (cron) pentru SANTA.
 * - Generarea facturilor lunare: în fiecare zi la 02:00, pentru contractele
 *   active a căror zi de facturare (billing_day) este ziua curentă.
 * - Verificarea scadențelor: zilnic la 03:00.
 */
const cron = require("node-cron");
const {
  generateInvoiceForContract,
  markOverdueInvoices,
} = require("../services/invoiceService");

const GRACE_DAYS = parseInt(process.env.GRACE_DAYS || "0", 10);

function startJobs(knex) {
  // Generare facturi — zilnic la 02:00
  cron.schedule("0 2 * * *", async () => {
    try {
      const today = new Date().getDate();
      const contracts = await knex("contracts")
        .where({ status: "ACTIVE" })
        .andWhere({ billing_day: today });
      let created = 0;
      for (const c of contracts) {
        const inv = await generateInvoiceForContract(knex, c);
        if (inv) created++;
      }
      if (created > 0) {
        console.log(`[CRON] Facturi generate automat: ${created}`);
      }
    } catch (err) {
      console.error("[CRON] Eroare la generarea facturilor:", err.message);
    }
  });

  // Verificare scadențe — zilnic la 03:00
  cron.schedule("0 3 * * *", async () => {
    try {
      const n = await markOverdueInvoices(knex, GRACE_DAYS);
      if (n > 0) {
        console.log(`[CRON] Facturi trecute în restanță: ${n}`);
      }
    } catch (err) {
      console.error("[CRON] Eroare la verificarea scadențelor:", err.message);
    }
  });

  console.log("[CRON] Sarcini programate inițializate.");
}

module.exports = { startJobs };
