/**
 * Migrare pentru adăugarea coordonatelor geografice (latitude, longitude) în tabela `properties`.
 * Permite afișarea proprietăților pe harta interactivă a Bucureștiului și filtrarea geografică.
 */
exports.up = function (knex) {
  return knex.schema.alterTable("properties", (table) => {
    table.decimal("latitude", 10, 7);
    table.decimal("longitude", 10, 7);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("properties", (table) => {
    table.dropColumn("latitude");
    table.dropColumn("longitude");
  });
};
