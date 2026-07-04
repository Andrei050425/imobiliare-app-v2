exports.up = function(knex) {
  return knex.schema.table("invoices", function(table) {
    table.decimal("penalty_ron", 10, 2).defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.table("invoices", function(table) {
    table.dropColumn("penalty_ron");
  });
};
