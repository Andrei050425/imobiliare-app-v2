const express = require("express");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const requireRole = require("../middleware/roles");

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

// GET /api/dashboard/admin — KPI globali
router.get("/admin", auth, requireRole("admin"), async (req, res) => {
  try {
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
      .select("contracts.contract_number", "contracts.end_date", "tenants.company_name as tenant_name", "properties.title as property_title")
      .orderBy("contracts.end_date", "asc")
      .limit(5);

    const overdueList = await knex("invoices")
      .where("invoices.status", "OVERDUE")
      .join("contracts", "invoices.contract_id", "contracts.id")
      .join("tenants", "contracts.tenant_id", "tenants.id")
      .select("invoices.invoice_number", "invoices.due_date", "invoices.total_ron", "tenants.company_name as tenant_name")
      .orderBy("invoices.due_date", "asc")
      .limit(10);

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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});



// GET /api/dashboard/tehnic — KPI mentenanță
router.get("/tehnic", auth, requireRole("admin", "tehnic"), async (req, res) => {
  try {
    const open = await knex("maintenance_requests").where({ status: "OPEN" }).count("id as c").first();
    const inProgress = await knex("maintenance_requests").where({ status: "IN_PROGRESS" }).count("id as c").first();
    const resolved = await knex("maintenance_requests").where({ status: "RESOLVED" }).count("id as c").first();
    const spacesMaint = await knex("properties").where({ status: "MAINTENANCE" }).count("id as c").first();
    const byPriority = await knex("maintenance_requests").whereIn("status", ["OPEN", "IN_PROGRESS"]).select("priority").count("id as c").groupBy("priority");

    const recent = await knex("maintenance_requests")
      .join("properties", "maintenance_requests.property_id", "properties.id")
      .whereIn("maintenance_requests.status", ["OPEN", "IN_PROGRESS"])
      .select("maintenance_requests.*", "properties.title as property_title")
      .orderBy("requested_at", "desc")
      .limit(8);

    res.json({
      open: Number(open.c),
      inProgress: Number(inProgress.c),
      resolved: Number(resolved.c),
      spacesInMaintenance: Number(spacesMaint.c),
      byPriority,
      recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/dashboard/client — KPI pentru chiriașul autentificat
router.get("/client", auth, requireRole("client"), async (req, res) => {
  try {
    const tenant = await knex("tenants").where({ user_id: req.user.id }).first();
    if (!tenant) return res.json({ noTenant: true });

    const activeContracts = await knex("contracts")
      .where({ tenant_id: tenant.id, status: "ACTIVE" })
      .count("id as c")
      .first();

    const outstanding = await knex("invoices")
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
      openMaintenance: Number(openMaint.c),
      nextInvoice: nextInvoice || null,
      rentedProperties
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
