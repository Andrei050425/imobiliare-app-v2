exports.up = function (knex) {
  return (
    knex.schema
      // 1. USERS
      .createTable("users", (table) => {
        table.increments("id").primary();
        table.string("email").notNullable().unique();
        table.string("password").notNullable(); // Parola criptată
        table.string("full_name");
        table.string("role").defaultTo("user"); // 'admin' sau 'user'
        table.timestamps(true, true); // created_at, updated_at
      })

      // 2. CATEGORIES (Birouri, Hale, etc.)
      .createTable("categories", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
      })

      // 3. PROPERTIES (Spațiile comerciale)
      .createTable("properties", (table) => {
        table.increments("id").primary();
        table.string("title").notNullable();
        table.text("description");
        table.decimal("price", 14, 2).notNullable(); // Preț numeric
        table.float("area").notNullable(); // Suprafața mp
        table.string("address").notNullable();

        // Relații
        table
          .integer("category_id")
          .references("id")
          .inTable("categories")
          .onDelete("SET NULL");
        table
          .integer("user_id")
          .references("id")
          .inTable("users")
          .onDelete("CASCADE"); // Cine a postat

        table.timestamps(true, true);
      })

      // 4. IMAGES
      .createTable("images", (table) => {
        table.increments("id").primary();
        table.string("path").notNullable(); // Calea fișierului pe disc
        table
          .integer("property_id")
          .references("id")
          .inTable("properties")
          .onDelete("CASCADE");
      })
  );
};

exports.down = function (knex) {
  // Ordinea inversă la ștergere pentru a nu strica Foreign Keys
  return knex.schema
    .dropTableIfExists("images")
    .dropTableIfExists("properties")
    .dropTableIfExists("categories")
    .dropTableIfExists("users");
};
