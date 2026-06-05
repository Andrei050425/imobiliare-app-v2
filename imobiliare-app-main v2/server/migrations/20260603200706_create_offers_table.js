/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("offers", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("property_id")
      .notNullable()
      .references("id")
      .inTable("properties")
      .onDelete("CASCADE");
    table.string("status").defaultTo("PENDING"); // PENDING, SENT
    table.decimal("offer_price", 14, 2);
    table.text("offer_details");
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("offers");
};
