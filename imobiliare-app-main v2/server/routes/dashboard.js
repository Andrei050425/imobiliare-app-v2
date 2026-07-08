const express = require("express");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const requireRole = require("../middleware/roles");
const { markOverdueInvoices } = require("../services/invoiceService");

const auth = passport.authenticate("jwt", { session: false });

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

async function getMonthlyStats(knex) {
  const allInvoicesForStats = await knex("invoices").select("issue_date", "total_ron", "status");
  const monthlyMap = {};
  const monthNamesRo = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  for (const r of allInvoicesForStats) {
    if (!r.issue_date) continue;
    const d = new Date(r.issue_date);
    const y = d.getFullYear();
    const mIdx = d.getMonth();
    const key = `${y}-${String(mIdx + 1).padStart(2, "0")}`;
    const label = `${monthNamesRo[mIdx]} ${y}`;
    if (!monthlyMap[key]) {
      monthlyMap[key] = { key, label, invoiced: 0, collected: 0 };
    }
    const val = parseFloat(r.total_ron || 0);
    monthlyMap[key].invoiced += val;
    if (r.status === "PAID") {
      monthlyMap[key].collected += val;
    }
  }
  return Object.values(monthlyMap).sort((a, b) => b.key.localeCompare(a.key));
}

// GET /api/dashboard/admin — KPI globali
router.get("/admin", auth, requireRole("admin"), async (req, res) => {
  try {
    await markOverdueInvoices(knex);
    const { start, end } = monthBounds();
    const totalSpaces = await knex("properties").count("id as c").first();
    const occupied = await knex("properties").where({ status: "OCCUPIED" }).count("id as c").first();
    const activeContracts = await knex("contracts").where({ status: "ACTIVE" }).count("id as c").first();
    const openMaint = await knex("maintenance_requests").whereIn("status", ["OPEN", "IN_PROGRESS"]).count("id as c").first();

    const invoiced = await knex("invoices")
      .whereBetween("issue_date", [start, end])
      .sum("total_ron as s")
      .first();
    const collected = await knex("invoices")
      .where({ status: "PAID" })
      .whereBetween("issue_date", [start, end])
      .sum("total_ron as s")
      .first();
    const overdueSum = await knex("invoices").where({ status: "OVERDUE" }).sum("total_ron as s").first();
    const overdueTenants = await knex("invoices")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .where("invoices.status", "OVERDUE")
      .countDistinct("contracts.tenant_id as c")
      .first();

    const byStatus = await knex("properties").select("status").count("id as c").groupBy("status");

    const expiring = await knex("contracts")
      .where("contracts.status", "ACTIVE")
      .andWhere("end_date", "<=", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
      .join("tenants", "contracts.tenant_id", "tenants.id")
      .join("properties", "contracts.property_id", "properties.id")
      .select("contracts.id", "contracts.contract_number", "contracts.end_date", "contracts.start_date", "contracts.monthly_rent_eur", "contracts.deposit_eur", "contracts.property_id", "tenants.company_name as tenant_name", "properties.title as property_title")
      .orderBy("contracts.end_date", "asc")
      .limit(5);

    const overdueList = await knex("invoices")
      .where("invoices.status", "OVERDUE")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .join("tenants", "contracts.tenant_id", "tenants.id")
      .select("invoices.invoice_number", "invoices.due_date", "invoices.total_ron", "tenants.company_name as tenant_name")
      .orderBy("invoices.due_date", "asc")
      .limit(10);

    const monthlyStats = await getMonthlyStats(knex);

    const total = Number(totalSpaces.c);
    const occ = Number(occupied.c);
    res.json({
      occupancyRate: total ? Math.round((occ / total) * 100) : 0,
      occupied: occ,
      totalSpaces: total,
      activeContracts: Number(activeContracts.c),
      openMaintenance: Number(openMaint.c),
      invoicedThisMonth: Number(invoiced.s || 0),
      collectedThisMonth: Number(collected.s || 0),
      overdueAmount: Number(overdueSum.s || 0),
      overdueTenants: Number(overdueTenants.c),
      spacesByStatus: byStatus,
      expiringContracts: expiring,
      overdueInvoices: overdueList,
      monthlyStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/dashboard/client — KPI pentru chiriașul autentificat
router.get("/client", auth, requireRole("client"), async (req, res) => {
  try {
    await markOverdueInvoices(knex);
    const tenant = await knex("tenants").where({ user_id: req.user.id }).first();
    if (!tenant) return res.json({ noTenant: true });

    const activeContracts = await knex("contracts")
      .where({ tenant_id: tenant.id, status: "ACTIVE" })
      .count("id as c")
      .first();

    const outstanding = await knex("invoices")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .where("contracts.tenant_id", tenant.id)
      .where("invoices.status", "OVERDUE")
      .sum("invoices.total_ron as s")
      .first();

    const totalToPay = await knex("invoices")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .where("contracts.tenant_id", tenant.id)
      .whereIn("invoices.status", ["ISSUED", "OVERDUE"])
      .sum("invoices.total_ron as s")
      .first();

    const openMaint = await knex("maintenance_requests")
      .where({ tenant_id: tenant.id })
      .whereIn("status", ["OPEN", "IN_PROGRESS"])
      .count("id as c")
      .first();

    const unpaidInvoicesCount = await knex("invoices")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .where("contracts.tenant_id", tenant.id)
      .whereIn("invoices.status", ["ISSUED", "OVERDUE"])
      .count("invoices.id as c")
      .first();

    const nextInvoice = await knex("invoices")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .where("contracts.tenant_id", tenant.id)
      .whereIn("invoices.status", ["ISSUED", "OVERDUE"])
      .select("invoices.*")
      .orderBy("invoices.due_date", "asc")
      .first();

    const rentedProperties = await knex("contracts")
      .where({ "contracts.tenant_id": tenant.id, "contracts.status": "ACTIVE" })
      .join("properties", "contracts.property_id", "properties.id")
      .leftJoin(
        knex("images").select("property_id").min("path as image_path").groupBy("property_id").as("img"),
        "img.property_id",
        "properties.id"
      )
      .select("properties.*", "contracts.contract_number", "img.image_path as image_path");

    res.json({
      tenantName: tenant.company_name,
      tenantStatus: tenant.status,
      activeContracts: Number(activeContracts.c),
      outstanding: Number(outstanding.s || 0),
      totalToPay: Number(totalToPay.s || 0),
      openMaintenance: Number(openMaint.c),
      unpaidCount: Number(unpaidInvoicesCount.c || 0),
      nextInvoice: nextInvoice || null,
      rentedProperties
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/dashboard/badges — Notificări (buline) pentru meniul lateral
router.get("/badges", auth, async (req, res) => {
  try {
    const role = req.user?.role;
    let offersCount = 0;
    let draftContractsCount = 0;
    let overdueInvoicesCount = 0;

    if (role === "admin" || role === "contabil") {
      if (role === "admin") {
        const o = await knex("offers").where({ status: "PENDING" }).count("id as c").first();
        offersCount = Number(o?.c || 0);
      }
      const c = await knex("contracts").where({ status: "DRAFT" }).count("id as c").first();
      draftContractsCount = Number(c?.c || 0);

      const i = await knex("invoices").where({ status: "OVERDUE" }).count("id as c").first();
      overdueInvoicesCount = Number(i?.c || 0);
    } else if (role === "client") {
      const tenant = await knex("tenants").where({ user_id: req.user.id }).first();
      if (tenant) {
        const c = await knex("contracts").where({ tenant_id: tenant.id }).where({ status: "DRAFT" }).count("id as c").first();
        draftContractsCount = Number(c?.c || 0);

        const i = await knex("invoices")
          .join("contracts", "invoices.contract_id", "contracts.id")
          .where("contracts.tenant_id", tenant.id)
          .where("invoices.status", "OVERDUE")
          .count("invoices.id as c")
          .first();
        overdueInvoicesCount = Number(i?.c || 0);
      }
      const o = await knex("offers").where({ user_id: req.user.id }).where({ status: "SENT" }).count("id as c").first();
      offersCount = Number(o?.c || 0);
    } else if (role === "user") {
      const o = await knex("offers").where({ user_id: req.user.id }).where({ status: "SENT" }).count("id as c").first();
      offersCount = Number(o?.c || 0);
    }

    res.json({
      offers: offersCount > 0,
      contracts: draftContractsCount > 0,
      invoices: overdueInvoicesCount > 0,
      offersCount,
      draftContractsCount,
      overdueInvoicesCount
    });
  } catch (err) {
    console.error("GET /api/dashboard/badges error:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
