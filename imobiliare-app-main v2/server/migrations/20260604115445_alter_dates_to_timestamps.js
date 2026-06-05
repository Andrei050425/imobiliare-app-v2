exports.up = async function(knex) {
  // Alter types from DATE to TIMESTAMP for contracts
  await knex.raw('ALTER TABLE contracts ALTER COLUMN start_date TYPE timestamp USING start_date::timestamp');
  await knex.raw('ALTER TABLE contracts ALTER COLUMN end_date TYPE timestamp USING end_date::timestamp');
  
  // Alter types from DATE to TIMESTAMP for invoices
  await knex.raw('ALTER TABLE invoices ALTER COLUMN issue_date TYPE timestamp USING issue_date::timestamp');
  await knex.raw('ALTER TABLE invoices ALTER COLUMN due_date TYPE timestamp USING due_date::timestamp');
  await knex.raw('ALTER TABLE invoices ALTER COLUMN period_start TYPE timestamp USING period_start::timestamp');
  await knex.raw('ALTER TABLE invoices ALTER COLUMN period_end TYPE timestamp USING period_end::timestamp');
  await knex.raw('ALTER TABLE invoices ALTER COLUMN paid_date TYPE timestamp USING paid_date::timestamp');
};

exports.down = async function(knex) {
  await knex.raw('ALTER TABLE contracts ALTER COLUMN start_date TYPE date USING start_date::date');
  await knex.raw('ALTER TABLE contracts ALTER COLUMN end_date TYPE date USING end_date::date');
  
  await knex.raw('ALTER TABLE invoices ALTER COLUMN issue_date TYPE date USING issue_date::date');
  await knex.raw('ALTER TABLE invoices ALTER COLUMN due_date TYPE date USING due_date::date');
  await knex.raw('ALTER TABLE invoices ALTER COLUMN period_start TYPE date USING period_start::date');
  await knex.raw('ALTER TABLE invoices ALTER COLUMN period_end TYPE date USING period_end::date');
  await knex.raw('ALTER TABLE invoices ALTER COLUMN paid_date TYPE date USING paid_date::date');
};
