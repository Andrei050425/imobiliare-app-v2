const express = require("express");
const router = express.Router();
const passport = require("passport");
const knex = require("knex")(require("../knexfile").development);
const isAdmin = require("../middleware/admin");

// Middleware comun: Trebuie să fii logat ȘI să fii admin
const adminAuth = [passport.authenticate("jwt", { session: false }), isAdmin];

// GET /api/users - Vezi toți userii
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await knex("users").select(
      "id",
      "full_name",
      "email",
      "role",
      "created_at",
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:id - Șterge un user
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    // Atenție: Datorită "ON DELETE CASCADE" din migrare,
    // dacă ștergem userul, se șterg automat și anunțurile lui!
    await knex("users").where({ id: req.params.id }).del();
    res.json({ message: "User șters cu succes." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la ștergere." });
  }
});

module.exports = router;
