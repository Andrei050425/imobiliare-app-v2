const express = require("express");
const router = express.Router();
const knex = require("knex")(require("../knexfile").development);

// GET /api/categories — listă categorii (public)
router.get("/", async (req, res) => {
  try {
    const categories = await knex("categories").select("*").orderBy("id");
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
