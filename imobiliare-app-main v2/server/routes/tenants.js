const express = require("express");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const requireRole = require("../middleware/roles");

const auth = passport.authenticate("jwt", { session: false });

// GET /api/tenants — listă (admin, contabil, tehnic)
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { status, q } = req.query;
    let query = knex("tenants").select("*").orderBy("created_at", "desc");
    if (status) query = query.where({ status });
    if (q) {
      query = query.where(function () {
        this.where("company_name", "ilike", `%${q}%`).orWhere(
          "cui",
          "ilike",
          `%${q}%`,
        );
      });
    }
    const tenants = await query;
    res.json(tenants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/tenants/:id — detaliu cu contracte și facturi
router.get("/:id", auth, async (req, res) => {
  try {
    const tenant = await knex("tenants").where({ id: req.params.id }).first();
    if (!tenant) return res.status(404).json({ message: "Chiriaș inexistent." });

    // Clientul poate vedea doar propriile date
    if (req.user.role === "client" && tenant.user_id !== req.user.id) {
      return res.status(403).json({ message: "Acces interzis." });
    }

    const contracts = await knex("contracts")
      .where({ tenant_id: tenant.id })
      .join("properties", "contracts.property_id", "properties.id")
      .select("contracts.*", "properties.title as property_title");
    tenant.contracts = contracts;
    res.json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// POST /api/tenants — creare (admin)
router.post("/", auth, requireRole("admin"), async (req, res) => {
  const { company_name, cui, reg_no, address, email, phone, legal_rep_name, user_id } =
    req.body;
  if (!company_name || !cui) {
    return res.status(400).json({ message: "Denumirea și CUI-ul sunt obligatorii." });
  }
  try {
    const existing = await knex("tenants").where({ cui }).first();
    if (existing) {
      return res.status(400).json({ message: "Există deja un chiriaș cu acest CUI." });
    }
    const [tenant] = await knex("tenants")
      .insert({
        company_name,
        cui,
        reg_no,
        address,
        email,
        phone,
        legal_rep_name,
        user_id: user_id || null,
        status: "PROSPECT",
      })
      .returning("*");
      
    if (user_id) {
      await knex("users").where({ id: user_id }).update({ role: "client" });
    }
    
    res.status(201).json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la creare." });
  }
});

// PUT /api/tenants/:id — editare (admin)
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const fields = (({
      company_name,
      reg_no,
      address,
      email,
      phone,
      legal_rep_name,
      status,
      user_id,
    }) => ({ company_name, reg_no, address, email, phone, legal_rep_name, status, user_id }))(
      req.body,
    );
    Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
    fields.updated_at = knex.fn.now();
    const [tenant] = await knex("tenants")
      .where({ id: req.params.id })
      .update(fields)
      .returning("*");
    if (!tenant) return res.status(404).json({ message: "Chiriaș inexistent." });
    
    if (fields.user_id) {
      await knex("users").where({ id: fields.user_id }).update({ role: "client" });
    }
    
    res.json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la actualizare." });
  }
});

// DELETE /api/tenants/:id — ștergere (admin)
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const tenant = await knex("tenants").where({ id: req.params.id }).first();
    if (!tenant) return res.status(404).json({ message: "Chiriaș inexistent." });

    // Pentru a putea șterge chiriașul, ștergem mai întâi contractele lui.
    await knex("contracts").where({ tenant_id: tenant.id }).del();
    
    // După ștergerea contractelor putem șterge chiriașul.
    await knex("tenants").where({ id: tenant.id }).del();
    
    res.json({ message: "Chiriaș șters cu succes." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la ștergerea chiriașului." });
  }
});

module.exports = router;
