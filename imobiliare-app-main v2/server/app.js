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
});

// --- PORNIRE SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Pornim sarcinile programate (generare facturi + verificare scadențe)
  try {
    startJobs(knex);
  } catch (e) {
    console.error("Nu s-au putut porni sarcinile programate:", e.message);
  }
});
