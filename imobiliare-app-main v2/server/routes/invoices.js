const express = require("express");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const requireRole = require("../middleware/roles");
const {
  generateMonthlyInvoices,
  markOverdueInvoices,
} = require("../services/invoiceService");

const auth = passport.authenticate("jwt", { session: false });

// GET /api/invoices — listă (admin, contabil)
router.get("/", auth, requireRole("admin", "contabil"), async (req, res) => {
  try {
    const { status } = req.query;
    let query = knex("invoices")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .join("tenants", "contracts.tenant_id", "tenants.id")
      .select(
        "invoices.*",
        "tenants.company_name as tenant_name",
        "contracts.contract_number",
      )
      .orderBy("invoices.issue_date", "desc");
    if (status) query = query.where("invoices.status", status);
    const invoices = await query;
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/invoices/mine — facturile clientului autentificat
router.get("/mine", auth, requireRole("client"), async (req, res) => {
  try {
    const tenant = await knex("tenants").where({ user_id: req.user.id }).first();
    if (!tenant) return res.json([]);
    const invoices = await knex("invoices")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .where("contracts.tenant_id", tenant.id)
      .select("invoices.*", "contracts.contract_number")
      .orderBy("invoices.issue_date", "desc");
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/invoices/:id — detaliu factură (pentru vizualizare / PDF)
router.get("/:id", auth, async (req, res) => {
  try {
    const invoice = await knex("invoices")
      .where({ "invoices.id": req.params.id })
      .join("contracts", "invoices.contract_id", "contracts.id")
      .join("tenants", "contracts.tenant_id", "tenants.id")
      .join("properties", "contracts.property_id", "properties.id")
      .select(
        "invoices.*",
        "contracts.contract_number",
        "tenants.company_name as tenant_name",
        "tenants.cui as tenant_cui",
        "tenants.address as tenant_address",
        "tenants.user_id as tenant_user_id",
        "properties.title as property_title",
        "properties.address as property_address",
      )
      .first();
    if (!invoice) return res.status(404).json({ message: "Factură inexistentă." });
    if (req.user.role === "client" && invoice.tenant_user_id !== req.user.id) {
      return res.status(403).json({ message: "Acces interzis." });
    }
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// POST /api/invoices/generate — generează facturile lunii (admin, contabil)
router.post("/generate", auth, requireRole("admin", "contabil"), async (req, res) => {
  try {
    const created = await generateMonthlyInvoices(knex, { date: req.body.date });
    res.json({ message: `Facturi generate: ${created}`, created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la generare." });
  }
});

// PATCH /api/invoices/:id/pay — marchează factura achitată (admin, contabil)
router.patch("/:id/pay", auth, requireRole("admin", "contabil"), async (req, res) => {
  try {
    const invoice = await knex("invoices").where({ id: req.params.id }).first();
    if (!invoice) return res.status(404).json({ message: "Factură inexistentă." });

    await knex("invoices").where({ id: invoice.id }).update({
      status: "PAID",
      paid_date: req.body.paid_date || new Date().toISOString().slice(0, 10),
      updated_at: knex.fn.now(),
    });

    // Dacă chiriașul nu mai are alte restanțe, revine la ACTIVE
    const contract = await knex("contracts").where({ id: invoice.contract_id }).first();
    if (contract) {
      const stillOverdue = await knex("invoices")
        .join("contracts", "invoices.contract_id", "contracts.id")
        .where("contracts.tenant_id", contract.tenant_id)
        .andWhere("invoices.status", "OVERDUE")
        .first();
      if (!stillOverdue) {
        await knex("tenants").where({ id: contract.tenant_id }).update({ status: "ACTIVE" });
      }
    }
    res.json({ message: "Factură marcată ca achitată." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la actualizare." });
  }
});

// PATCH /api/invoices/:id/cancel — anulează factura (admin, contabil)
router.patch("/:id/cancel", auth, requireRole("admin", "contabil"), async (req, res) => {
  try {
    const [inv] = await knex("invoices")
      .where({ id: req.params.id })
      .update({ status: "CANCELLED", updated_at: knex.fn.now() })
      .returning("*");
    if (!inv) return res.status(404).json({ message: "Factură inexistentă." });
    res.json({ message: "Factură anulată." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la anulare." });
  }
});

module.exports = router;
