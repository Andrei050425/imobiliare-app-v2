const express = require("express");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const upload = require("../middleware/upload");
const { validateProperty } = require("../middleware/validation");
const fs = require("fs");
const path = require("path");

// Middleware pentru a proteja rutele (cere token valid)
const auth = passport.authenticate("jwt", { session: false });

// 1. GET ALL - Vezi spațiile, cu filtre opționale (Public)
// Query params: sector, status, category_id, q (căutare în titlu/adresă)
router.get("/", async (req, res) => {
  try {
    const { sector, status, category_id, q } = req.query;

    let query = knex("properties")
      .join("categories", "properties.category_id", "categories.id")
      .leftJoin("images", "properties.id", "images.property_id")
      .select(
        "properties.*",
        "categories.name as category_name",
        knex.raw("MIN(images.path) as image_path"), // Luăm o singură poză pentru listă
      )
      .groupBy("properties.id", "categories.name");

    if (sector) query = query.where("properties.sector", sector);
    if (status) query = query.where("properties.status", status);
    if (category_id) query = query.where("properties.category_id", category_id);
    if (q) {
      query = query.where(function () {
        this.where("properties.title", "ilike", `%${q}%`).orWhere(
          "properties.address",
          "ilike",
          `%${q}%`,
        );
      });
    }

    const properties = await query;
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. GET ONE - Vezi detalii spațiu (Public)
router.get("/:id", async (req, res) => {
  try {
    const property = await knex("properties")
      .where({ "properties.id": req.params.id })
      .join("categories", "properties.category_id", "categories.id")
      .join("users", "properties.user_id", "users.id")
      .select(
        "properties.*",
        "categories.name as category_name",
        "users.full_name as owner_name",
      )
      .first();

    if (!property)
      return res.status(404).json({ message: "Spațiul nu a fost găsit" });

    // Luăm toate pozele asociate
    const images = await knex("images")
      .where({ property_id: req.params.id })
      .select("id", "path");
    property.images = images;

    res.json(property);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 3. CREATE - Adaugă spațiu (Doar Autentificat)
// Folosim upload.single('image') -> așteaptă un câmp numit "image" în form-data
router.post(
  "/",
  auth,
  upload.single("image"),
  validateProperty,
  async (req, res) => {
    console.log("------------------------------------------------");
    console.log(">>> REQUEST POST /properties INITIAT");

    // 1. Verificăm Body (Datele text)
    console.log(">>> BODY Primit:", req.body);

    // 2. Verificăm Fișierul (Aici e cheia!)
    if (req.file) {
      console.log(">>> FILE Primit (SUCCES):");
      console.log(req.file);
    } else {
      console.log(">>> FILE LIPSĂ (REQ.FILE E UNDEFINED) !!!");
      console.log(
        "Posibile cauze: Numele câmpului nu e 'image' sau FormData e gol.",
      );
    }
    console.log("------------------------------------------------");

    try {
      await knex.transaction(async (trx) => {
        // Pas 1: Inserăm proprietatea
        const [newProp] = await trx("properties")
          .insert({
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            area: req.body.area,
            address: req.body.address,
            sector: req.body.sector || null,
            status: req.body.status || "FREE",
            category_id: req.body.category_id,
            user_id: req.user.id,
          })
          .returning("id");

        console.log(">>> Proprietate inserată cu ID:", newProp.id);

        // Pas 2: Inserăm poza
        if (req.file) {
          const cleanPath = req.file.path.replace(/\\/g, "/");
          console.log(">>> Încercăm salvare imagine în DB:", cleanPath);

          await trx("images").insert({
            path: cleanPath,
            property_id: newProp.id,
          });
          console.log(">>> Imagine salvată în DB cu succes.");
        } else {
          console.log(">>> Sărim peste salvarea imaginii (nu există fișier).");
        }
      });

      res.status(201).json({ message: "Anunț adăugat cu succes!" });
    } catch (err) {
      console.error(">>> EROARE SERVER:", err);
      res.status(500).json({ message: "Nu s-a putut salva anunțul." });
    }
  },
);

// 3.5 PUT - Editează spațiu (Doar Autentificat, Admin sau Proprietar)
router.put("/:id", auth, async (req, res) => {
  try {
    const property = await knex("properties").where({ id: req.params.id }).first();
    if (!property) return res.status(404).json({ message: "Nu există spațiul." });
    
    if (req.user.role !== "admin" && property.user_id !== req.user.id) {
      return res.status(403).json({ message: "Nu ai dreptul să editezi acest anunț." });
    }

    await knex("properties")
      .where({ id: req.params.id })
      .update({
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        area: req.body.area,
        address: req.body.address,
        sector: req.body.sector || null,
        status: req.body.status || "FREE",
        category_id: req.body.category_id,
        updated_at: knex.fn.now()
      });

    res.json({ message: "Anunț actualizat cu succes." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la actualizare." });
  }
});

// 3.6 POST - Adaugă imagine la spațiu (Admin sau Proprietar)
router.post("/:id/images", auth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Fișier lipsă." });
  try {
    const property = await knex("properties").where({ id: req.params.id }).first();
    if (!property) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Nu există spațiul." });
    }
    if (req.user.role !== "admin" && property.user_id !== req.user.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: "Nu ai dreptul." });
    }

    const cleanPath = req.file.path.replace(/\\/g, "/");
    const [inserted] = await knex("images").insert({
      path: cleanPath,
      property_id: req.params.id
    }).returning("*");

    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Eroare la adăugarea imaginii." });
  }
});

// 3.7 DELETE - Șterge imagine (Admin sau Proprietar)
router.delete("/:id/images/:imageId", auth, async (req, res) => {
  try {
    const property = await knex("properties").where({ id: req.params.id }).first();
    if (!property) return res.status(404).json({ message: "Nu există spațiul." });
    if (req.user.role !== "admin" && property.user_id !== req.user.id) {
      return res.status(403).json({ message: "Nu ai dreptul." });
    }

    const image = await knex("images").where({ id: req.params.imageId, property_id: req.params.id }).first();
    if (!image) return res.status(404).json({ message: "Imaginea nu a fost găsită." });

    await knex("images").where({ id: req.params.imageId }).del();

    const filePath = path.join(__dirname, "..", image.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Imagine ștearsă cu succes." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la ștergerea imaginii." });
  }
});

// 4. DELETE - Șterge spațiu (Admin sau Proprietar)
router.delete("/:id", auth, async (req, res) => {
  try {
    const property = await knex("properties")
      .where({ id: req.params.id })
      .first();
    if (!property) return res.status(404).json({ message: "Nu există." });

    // Verificare Permisiuni: Ești Admin SAU ești proprietarul?
    if (req.user.role !== "admin" && property.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Nu ai dreptul să ștergi acest anunț." });
    }

    // Ștergerea propagă automat și imaginile (dacă am setat ON DELETE CASCADE în migrare)
    await knex("properties").where({ id: req.params.id }).del();

    res.json({ message: "Anunț șters." });
  } catch (err) {
    res.status(500).json({ message: "Eroare la ștergere." });
  }
});

module.exports = router;
