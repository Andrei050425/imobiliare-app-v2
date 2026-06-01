require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    connection: {
      // Folosim variabila de mediu DB_HOST dacă există, altfel 'localhost'
      host: process.env.DB_HOST || "127.0.0.1",
      user: "admin",
      password: "password123",
      database: "imobiliare_db",
      charset: "utf8",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
  },
};
