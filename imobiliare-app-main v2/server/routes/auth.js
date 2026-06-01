const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const knex = require("knex")(require("../knexfile").development);
const { validateRegister, validateLogin } = require("../middleware/validation");

// --- REGISTER ---
router.post("/register", validateRegister, async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    // 1. Verificăm dacă email-ul există deja
    const existingUser = await knex("users").where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ message: "Email-ul este deja folosit." });
    }

    // 2. Criptăm parola
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Salvăm userul (Default role: 'user')
    // Postgres returnează datele inserate prin .returning('*')
    const [newUser] = await knex("users")
      .insert({
        full_name,
        email,
        password: hashedPassword,
        role: "user",
      })
      .returning(["id", "email", "full_name", "role"]);

    res.status(201).json({ message: "Cont creat cu succes!", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// --- LOGIN ---
router.post("/login", validateLogin, async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Căutăm userul
    const user = await knex("users").where({ email }).first();
    if (!user) {
      return res.status(400).json({ message: "Email sau parolă incorectă." });
    }

    // 2. Verificăm parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email sau parolă incorectă." });
    }

    // 3. Generăm Token-ul JWT
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "secretul_tau_super_secret",
      {
        expiresIn: "1d", // Expiră într-o zi
      },
    );

    res.json({
      message: "Logare reușită!",
      token: "Bearer " + token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
