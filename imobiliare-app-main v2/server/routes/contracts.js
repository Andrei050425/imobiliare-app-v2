const express = require("express");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const requireRole = require("../middleware/roles");

const auth = passport.authenticate("jwt", { session: false });

// Generează numărul de contract: CTR-AAAA-NNNN
async function nextContractNumber(year) {
  const prefix = `CTR-${year}-`;
  const last = await knex("contracts")
    .where("contract_number", "like", `${prefix}%`)
    .orderBy("contract_number", "desc")
    .first();
  let seq = 1;
  if (last) {
    const n = parseInt(last.contract_number.split("-")[2], 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return prefix + String(seq).padStart(4, "0");
}

// GET /api/contracts — listă cu join chiriaș + spațiu
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    let query = knex("contracts")
      .join("tenants", "contracts.tenant_id", "tenants.id")
      .join("properties", "contracts.property_id", "properties.id")
      .select(
        "contracts.*",
        "tenants.company_name as tenant_name",
        "properties.title as property_title",
      )
      .orderBy("contracts.created_at", "desc");
    if (status) query = query.where("contracts.status", status);
    const contracts = await query;
    res.json(contracts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/contracts/mine — contractele clientului autentificat
router.get("/mine", auth, requireRole("client"), async (req, res) => {
  try {
    const tenant = await knex("tenants").where({ user_id: req.user.id }).first();
    if (!tenant) return res.json([]);
    const contracts = await knex("contracts")
      .where({ tenant_id: tenant.id })
      .join("properties", "contracts.property_id", "properties.id")
      .select("contracts.*", "properties.title as property_title", "properties.address");
    res.json(contracts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// POST /api/contracts — creare (admin)
router.post("/", auth, requireRole("admin"), async (req, res) => {
  const {
    tenant_id,
    property_id,
    start_date,
    end_date,
    monthly_rent_eur,
    deposit_eur,
    billing_day,
    utilities_ron,
  } = req.body;

  if (!tenant_id || !property_id || !start_date || !end_date || !monthly_rent_eur) {
    return res.status(400).json({ message: "Câmpuri obligatorii lipsă." });
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return res
      .status(400)
      .json({ message: "Data de sfârșit trebuie să fie după data de început." });
  }

  try {
    const tenant = await knex("tenants").where({ id: tenant_id }).first();
    if (!tenant) return res.status(404).json({ message: "Chiriaș inexistent." });
    if (tenant.status === "OVERDUE") {
      return res
        .status(400)
        .json({ message: "Chiriașul are restanțe și nu poate primi contracte noi." });
    }

    const property = await knex("properties").where({ id: property_id }).first();
    if (!property) return res.status(404).json({ message: "Spațiu inexistent." });
    if (property.status !== "FREE") {
      return res.status(400).json({ message: "Spațiul nu este disponibil." });
    }

    // Verificăm să nu existe deja un contract DRAFT sau ACTIVE pe acest spațiu
    const existingContract = await knex("contracts")
      .where({ property_id })
      .whereIn("status", ["DRAFT", "ACTIVE"])
      .first();
    if (existingContract) {
      return res.status(400).json({ message: "Există deja un contract activ sau în curs de validare (ciornă) pentru acest spațiu. Un utilizator sau chiriaș nu poate avea 2 contracte diferite pe același spațiu." });
    }

    const year = new Date(start_date).getFullYear();
    const contractNumber = await nextContractNumber(year);

    const result = await knex.transaction(async (trx) => {
      const [contract] = await trx("contracts")
        .insert({
          contract_number: contractNumber,
          tenant_id,
          property_id,
          employee_id: req.user.id,
          start_date,
          end_date,
          monthly_rent_eur,
          deposit_eur: deposit_eur || 0,
          billing_day: billing_day || 1,
          utilities_ron: utilities_ron || 0,
          status: "DRAFT",
        })
        .returning("*");

      // Ciornă -> spațiul devine REZERVAT
      await trx("properties").where({ id: property_id }).update({ status: "RESERVED" });
      return contract;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la creare contract." });
  }
});

// PATCH /api/contracts/:id/activate — activează contractul (admin)
router.patch("/:id/activate", auth, requireRole("admin"), async (req, res) => {
  try {
    const contract = await knex("contracts").where({ id: req.params.id }).first();
    if (!contract) return res.status(404).json({ message: "Contract inexistent." });
    if (contract.status !== "DRAFT") {
      return res.status(400).json({ message: "Doar ciornele pot fi activate." });
    }
    await knex.transaction(async (trx) => {
      await trx("contracts").where({ id: contract.id }).update({
        status: "ACTIVE",
        updated_at: knex.fn.now(),
      });
      await trx("properties").where({ id: contract.property_id }).update({ status: "OCCUPIED" });
      await trx("tenants").where({ id: contract.tenant_id }).update({ status: "ACTIVE" });
    });
    res.json({ message: "Contract activat." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la activare." });
  }
});

// PATCH /api/contracts/:id/terminate — reziliază contractul (admin)
router.patch("/:id/terminate", auth, requireRole("admin"), async (req, res) => {
  try {
    const contract = await knex("contracts").where({ id: req.params.id }).first();
    if (!contract) return res.status(404).json({ message: "Contract inexistent." });
    await knex.transaction(async (trx) => {
      await trx("contracts").where({ id: contract.id }).update({
        status: "TERMINATED",
        termination_reason: req.body.reason || null,
        updated_at: knex.fn.now(),
      });
      await trx("properties").where({ id: contract.property_id }).update({ status: "FREE" });

      // Verificăm câte contracte ACTIVE mai are acest chiriaș
      const activeContracts = await trx("contracts")
        .where({ tenant_id: contract.tenant_id, status: "ACTIVE" })
        .count("id as count")
        .first();

      if (parseInt(activeContracts.count) === 0) {
        // Dacă nu mai are contracte active, îi setăm statusul INACTIVE 
        await trx("tenants").where({ id: contract.tenant_id }).update({ status: "INACTIVE" });
        
        // Preluăm user_id-ul aferent
        const tenant = await trx("tenants").where({ id: contract.tenant_id }).first();
        if (tenant && tenant.user_id) {
          // Și îl retrogradăm la 'user'
          await trx("users").where({ id: tenant.user_id }).update({ role: "user" });
        }
      }
    });
    res.json({ message: "Contract reziliat." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la reziliere." });
  }
});

// PATCH /api/contracts/:id/extend — extinde contractul cu N luni (admin)
router.patch("/:id/extend", auth, requireRole("admin"), async (req, res) => {
  try {
    const contract = await knex("contracts").where({ id: req.params.id }).first();
    if (!contract) return res.status(404).json({ message: "Contract inexistent." });
    if (contract.status !== "ACTIVE") {
      return res.status(400).json({ message: "Doar contractele active pot fi extinse." });
    }

    const months = parseInt(req.body.months, 10);
    if (!months || months < 1 || months > 60) {
      return res.status(400).json({ message: "Durata de extindere trebuie să fie între 1 și 60 de luni." });
    }

    const currentEnd = new Date(contract.end_date);
    currentEnd.setMonth(currentEnd.getMonth() + months);
    const newEndDate = currentEnd.toISOString().slice(0, 10);

    await knex("contracts").where({ id: contract.id }).update({
      end_date: newEndDate,
      updated_at: knex.fn.now(),
    });

    res.json({ message: `Contract extins cu ${months} luni. Noua dată de expirare: ${newEndDate}`, new_end_date: newEndDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la extinderea contractului." });
  }
});

module.exports = router;
