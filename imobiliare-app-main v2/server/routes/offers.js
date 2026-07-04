const express = require("express");
console.log("Evaluating offers.js...");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const requireRole = require("../middleware/roles");

const auth = passport.authenticate("jwt", { session: false });

// GET /api/offers - listă cereri/oferte pentru admin
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const offers = await knex("offers")
      .join("users", "offers.user_id", "users.id")
      .join("properties", "offers.property_id", "properties.id")
      .leftJoin(
        knex("images").select("property_id").min("path as image_path").groupBy("property_id").as("img"),
        "img.property_id",
        "properties.id"
      )
      .select(
        "offers.*",
        "users.full_name as user_name",
        "users.email as user_email",
        "users.phone as user_phone",
        "properties.title as property_title",
        "properties.price as property_price",
        "img.image_path as image_path"
      )
      .orderBy("offers.created_at", "desc");
    res.json(offers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET /api/offers/mine - oferte pentru utilizatorul curent
router.get("/mine", auth, async (req, res) => {
  try {
    const offers = await knex("offers")
      .where("offers.user_id", req.user.id)
      .join("properties", "offers.property_id", "properties.id")
      .leftJoin(
        knex("images").select("property_id").min("path as image_path").groupBy("property_id").as("img"),
        "img.property_id",
        "properties.id"
      )
      .select("offers.*", "properties.title as property_title", "properties.price as property_price", "img.image_path as image_path")
      .orderBy("offers.created_at", "desc");
    res.json(offers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// POST /api/offers - creare cerere nouă de la user
router.post("/", auth, async (req, res) => {
  try {
    const { property_id, offer_price, offer_details } = req.body;
    if (!property_id) return res.status(400).json({ message: "property_id lipsă." });

    // Verificăm să nu existe deja un contract DRAFT sau ACTIVE pe acest spațiu
    const existingContract = await knex("contracts")
      .where({ property_id })
      .whereIn("status", ["DRAFT", "ACTIVE"])
      .first();
    if (existingContract) {
      return res.status(400).json({ message: "Acest spațiu are deja un contract activ sau în curs de validare și nu se mai pot trimite oferte." });
    }

    // Verificăm dacă utilizatorul are deja o ofertă activă (PENDING sau SENT) pentru acest spațiu
    const existingOffer = await knex("offers")
      .where({ user_id: req.user.id, property_id })
      .whereIn("status", ["PENDING", "SENT"])
      .first();
    if (existingOffer) {
      return res.status(400).json({ message: "Ai deja o ofertă trimisă pentru acest spațiu! Nu mai poți trimite alta până nu o anulezi pe cea trimisă înainte." });
    }

    const [offer] = await knex("offers")
      .insert({
        user_id: req.user.id,
        property_id,
        status: "PENDING",
        offer_price: offer_price || 0,
        offer_details: typeof offer_details === 'object' ? JSON.stringify(offer_details) : (offer_details || ""),
      })
      .returning("*");
    res.status(201).json({ message: "Ofertă trimisă cu succes!", offer });
  } catch (err) {
    console.error("POST /api/offers error:", err);
    res.status(500).json({ message: "Eroare server.", error: err.message });
  }
});

// PATCH /api/offers/:id/send - trimitere ofertă de către admin
router.patch("/:id/send", auth, requireRole("admin"), async (req, res) => {
  try {
    const { offer_price, offer_details } = req.body;
    const { id } = req.params;

    const [updatedOffer] = await knex("offers")
      .where({ id })
      .update({
        status: "SENT",
        offer_price: offer_price || 0,
        offer_details: typeof offer_details === 'object' ? JSON.stringify(offer_details) : (offer_details || ""),
        updated_at: knex.fn.now(),
      })
      .returning("*");

    res.json({ message: "Contraofeta a fost trimisă către client!", offer: updatedOffer });
  } catch (err) {
    console.error("PATCH /api/offers/:id/send error:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// PATCH /api/offers/:id/reject - refuzare ofertă de către client
router.patch("/:id/reject", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await knex("offers").where({ id, user_id: req.user.id }).first();
    if (!offer) return res.status(404).json({ message: "Cererea nu a fost găsită." });
    if (offer.status !== "SENT") return res.status(400).json({ message: "Oferta nu este în așteptarea unui răspuns." });

    const [updatedOffer] = await knex("offers")
      .where({ id })
      .update({
        status: "REJECTED",
        updated_at: knex.fn.now(),
      })
      .returning("*");

    res.json({ message: "Ofertă refuzată.", offer: updatedOffer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// DELETE /api/offers/:id - anulare ofertă de către client (pentru oferte aflate în așteptare / transmise)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await knex("offers").where({ id, user_id: req.user.id }).first();
    if (!offer) return res.status(404).json({ message: "Oferta nu a fost găsită." });
    if (!["PENDING", "SENT"].includes(offer.status)) {
      return res.status(400).json({ message: "Poți anula doar ofertele aflate în așteptare sau care nu au fost încă acceptate." });
    }

    await knex("offers").where({ id }).del();
    res.json({ message: "Oferta a fost anulată și ștearsă cu succes." });
  } catch (err) {
    console.error("DELETE /api/offers/:id error:", err);
    res.status(500).json({ message: "Eroare la anularea ofertei." });
  }
});

// PATCH /api/offers/:id/accept - acceptare ofertă de către client
router.patch("/:id/accept", auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificăm dacă oferta aparține utilizatorului curent
    const offer = await knex("offers").where({ id, user_id: req.user.id }).first();
    if (!offer) return res.status(404).json({ message: "Cererea nu a fost găsită." });
    if (offer.status !== "SENT") return res.status(400).json({ message: "Oferta nu este validă pentru acceptare." });

    // Verificăm să nu existe deja un contract DRAFT sau ACTIVE pe acest spațiu
    const existingContract = await knex("contracts")
      .where({ property_id: offer.property_id })
      .whereIn("status", ["DRAFT", "ACTIVE"])
      .first();
    if (existingContract) {
      return res.status(400).json({ message: "Acest spațiu are deja un contract validat sau în curs de validare. Un spațiu nu poate avea 2 contracte active." });
    }

    // Preluăm utilizatorul complet
    const user = await knex("users").where({ id: req.user.id }).first();

    // Actualizăm statusul ofertei
    await knex("offers")
      .where({ id })
      .update({
        status: "ACCEPTED",
        updated_at: knex.fn.now(),
      });

    // Căutăm dacă este deja chiriaș
    let tenant = await knex("tenants").where({ user_id: req.user.id }).first();
    
    if (!tenant) {
      // Obținem informațiile despre proprietate pentru adresă
      const property = await knex("properties").where({ id: offer.property_id }).first();
      const tenantAddress = property ? property.address : "";

      // Generare CUI de 8 cifre
      const uniqueCui = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      // Generare Nr. Reg. Comertului
      const randomJ = Math.floor(1000 + Math.random() * 9000);
      const regNo = `J40/${randomJ}/${new Date().getFullYear()}`;

      // Generare telefon automat (dacă userul nu are)
      const randomPhone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
      const phone = user.phone || randomPhone;

      // Creăm un nou chiriaș
      const [newTenant] = await knex("tenants")
        .insert({
          user_id: req.user.id,
          company_name: user.full_name || user.email,
          cui: uniqueCui,
          reg_no: regNo,
          address: tenantAddress,
          email: user.email,
          phone: phone,
          legal_rep_name: user.full_name,
          status: "PROSPECT",
        })
        .returning("*");
      tenant = newTenant;
      
      // Actualizăm rolul utilizatorului la 'client'
      await knex("users").where({ id: req.user.id }).update({ role: "client" });
    }

    // Parsăm datele ofertei pentru a crea contractul
    let detailsObj = null;
    try {
      if (offer.offer_details) {
        detailsObj = JSON.parse(offer.offer_details);
      }
    } catch (e) {
      console.log("Nu am putut parsa offer_details ca JSON", e);
    }

    const startDate = (detailsObj && detailsObj.start_date) ? detailsObj.start_date : new Date();
    const endDate = (detailsObj && detailsObj.end_date) ? detailsObj.end_date : new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    const deposit = (detailsObj && detailsObj.deposit_eur !== undefined) ? detailsObj.deposit_eur : (offer.offer_price * 2 || 0);
    const utilities = (detailsObj && detailsObj.utilities_ron !== undefined) ? detailsObj.utilities_ron : 0;
    const contractNumber = `CTR-${Date.now()}`;

    // Creăm contractul de închiriere în stadiu de DRAFT
    const [contract] = await knex("contracts")
      .insert({
        contract_number: contractNumber,
        tenant_id: tenant.id,
        property_id: offer.property_id,
        start_date: startDate,
        end_date: endDate,
        monthly_rent_eur: offer.offer_price || 0,
        deposit_eur: deposit,
        utilities_ron: utilities,
        status: "DRAFT",
      })
      .returning("*");

    // Actualizăm starea spațiului la RESERVED după acceptarea ofertei de către client
    if (offer.property_id) {
      await knex("properties")
        .where({ id: offer.property_id })
        .update({ status: "RESERVED" });
    }

    // Generăm un nou token pentru că s-a schimbat rolul din user în client
    const jwt = require("jsonwebtoken");
    const payload = { id: user.id, role: "client" };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "secretul_tau_super_secret",
      { expiresIn: "1d" }
    );

    res.json({ 
      message: "Ofertă acceptată! Ești acum chiriaș.", 
      contract, 
      tenant,
      token: "Bearer " + token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: "client"
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// DELETE /api/offers/:id - anulare/ștergere cerere (admin)
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await knex("offers").where({ id }).del();
    if (!deleted) {
      return res.status(404).json({ message: "Cererea nu a fost găsită." });
    }
    res.json({ message: "Cererea a fost anulată cu succes." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
