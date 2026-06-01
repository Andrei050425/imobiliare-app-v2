const express = require("express");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const requireRole = require("../middleware/roles");

const auth = passport.authenticate("jwt", { session: false });

// GET /api/maintenance — listă (admin, tehnic)
router.get("/", auth, requireRole("admin", "tehnic"), async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = knex("maintenance_requests")
      .join("properties", "maintenance_requests.property_id", "properties.id")
      .leftJoin("users", "maintenance_requests.employee_id", "users.id")
      .select(
        "maintenance_requests.*",
        "properties.title as property_title",
        "users.full_name as employee_name",
      )
      .orderBy("maintenance_requests.requested_at", "desc");
    if (status) query = query.where("maintenance_requests.status", status);
    if (priority) query = query.where("maintenance_requests.priority", priority);
    const list = await query;
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/maintenance/mine — intervențiile raportate de clientul curent
router.get("/mine", auth, requireRole("client"), async (req, res) => {
  try {
    const tenant = await knex("tenants").where({ user_id: req.user.id }).first();
    if (!tenant) return res.json([]);
    const list = await knex("maintenance_requests")
      .where({ tenant_id: tenant.id })
      .join("properties", "maintenance_requests.property_id", "properties.id")
      .select("maintenance_requests.*", "properties.title as property_title")
      .orderBy("requested_at", "desc");
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// POST /api/maintenance — creare (admin, tehnic, client)
router.post("/", auth, requireRole("admin", "tehnic", "client"), async (req, res) => {
  const { property_id, description, priority, employee_id } = req.body;
  if (!property_id || !description) {
    return res.status(400).json({ message: "Spațiul și descrierea sunt obligatorii." });
  }
  try {
    let tenant_id = null;
    if (req.user.role === "client") {
      const tenant = await knex("tenants").where({ user_id: req.user.id }).first();
      tenant_id = tenant ? tenant.id : null;
    }
    const [request] = await knex("maintenance_requests")
      .insert({
        property_id,
        description,
        priority: priority || "MEDIUM",
        employee_id: req.user.role === "client" ? null : employee_id || null,
        tenant_id,
        status: "OPEN",
      })
      .returning("*");
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la creare." });
  }
});

// PATCH /api/maintenance/:id — actualizează stare / note (admin, tehnic)
router.patch("/:id", auth, requireRole("admin", "tehnic"), async (req, res) => {
  try {
    const fields = {};
    if (req.body.status) fields.status = req.body.status;
    if (req.body.resolution_notes !== undefined)
      fields.resolution_notes = req.body.resolution_notes;
    if (req.body.employee_id !== undefined) fields.employee_id = req.body.employee_id;
    if (req.body.status === "RESOLVED") fields.resolved_at = knex.fn.now();
    fields.updated_at = knex.fn.now();

    const [request] = await knex("maintenance_requests")
      .where({ id: req.params.id })
      .update(fields)
      .returning("*");
    if (!request) return res.status(404).json({ message: "Intervenție inexistentă." });

    // Dacă se pune spațiul în întreținere
    if (req.body.set_property_maintenance) {
      await knex("properties").where({ id: request.property_id }).update({ status: "MAINTENANCE" });
    }
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la actualizare." });
  }
});

module.exports = router;
