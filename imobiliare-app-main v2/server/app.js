require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("passport"); // <--- NOU: Importăm Passport
const knex = require("knex")(require("./knexfile").development);
const authRoutes = require("./routes/auth");
const propertiesRoutes = require("./routes/properties");
const usersRoutes = require("./routes/users");
const categoriesRoutes = require("./routes/categories");
const tenantsRoutes = require("./routes/tenants");
const contractsRoutes = require("./routes/contracts");
const invoicesRoutes = require("./routes/invoices");
const maintenanceRoutes = require("./routes/maintenance");
const dashboardRoutes = require("./routes/dashboard");
const offersRoutes = require("./routes/offers");
console.log("Loading app.js, offersRoutes stack length:", offersRoutes.stack ? offersRoutes.stack.length : 'unknown');
const { startJobs } = require("./jobs/scheduler");
const app = express();

// --- Middleware ---
app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors());

// <--- NOU: Inițializare Passport
app.use(passport.initialize());
// <--- NOU: Încărcăm strategia JWT
require("./config/passport")(passport);
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/tenants", tenantsRoutes);
app.use("/api/contracts", contractsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/offers", (req, res, next) => {
  console.log("HIT /api/offers");
  next();
}, offersRoutes);
// Rute de test
app.get("/", (req, res) => {
  res.json({ message: "Serverul functioneaza! 🚀" });
});

app.get("/api/health", async (req, res) => {
  try {
    await knex.raw("SELECT 1");
    res.json({ status: "Database connected successfully! ✅" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "Database connection failed ❌", error: err.message });
  }
  app.use((err, req, res, next) => {
    console.error(">>> EROARE NEHANDLED:", err);
    res.status(err.status || 500).json({
      message: err.message || "A apărut o eroare neașteptată pe server.",
    });
  });
});

// --- PORNIRE SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Sincronizare automată: proprietățile cu contracte active → OCCUPIED
  try {
    const activePropertyIds = await knex("contracts")
      .where("status", "ACTIVE")
      .select("property_id");
    if (activePropertyIds.length > 0) {
      const ids = activePropertyIds.map((r) => r.property_id);
      const updated = await knex("properties")
        .whereIn("id", ids)
        .whereNot("status", "OCCUPIED")
        .update({ status: "OCCUPIED" });
      if (updated > 0) {
        console.log(`[SYNC] ${updated} proprietăți sincronizate la status OCCUPIED.`);
      }
    }
    // Proprietățile cu contracte DRAFT → RESERVED
    const draftPropertyIds = await knex("contracts")
      .where("status", "DRAFT")
      .select("property_id");
    if (draftPropertyIds.length > 0) {
      const ids = draftPropertyIds.map((r) => r.property_id);
      const updated = await knex("properties")
        .whereIn("id", ids)
        .whereNot("status", "RESERVED")
        .whereNotIn("id", activePropertyIds.map((r) => r.property_id)) // nu suprascrie OCCUPIED
        .update({ status: "RESERVED" });
      if (updated > 0) {
        console.log(`[SYNC] ${updated} proprietăți sincronizate la status RESERVED.`);
      }
    }
  } catch (e) {
    console.error("[SYNC] Eroare sincronizare status proprietăți:", e.message);
  }

  // Pornim sarcinile programate (generare facturi + verificare scadențe)
  try {
    startJobs(knex);
  } catch (e) {
    console.error("Nu s-au putut porni sarcinile programate:", e.message);
  }
});
