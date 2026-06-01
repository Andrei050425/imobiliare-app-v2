/**
 * Migrare aditivă SANTA — extinde schema portalului de anunțuri către
 * sistemul de gestiune a închirierilor descris în lucrare.
 *
 * - Extinde `users` (telefon, activ) — rolurile suportate devin:
 *   'admin', 'contabil', 'tehnic', 'client'
 * - Extinde `properties` (sector, status) — devin portofoliul firmei
 * - Adaugă: tenants, contracts, invoices, maintenance_requests
 */
exports.up = function (knex) {
  return knex.schema
    // 1. Extindem USERS
    .alterTable("users", (table) => {
      table.string("phone");
      table.boolean("active").defaultTo(true);
    })

    // 2. Extindem PROPERTIES (portofoliul de spații)
    .alterTable("properties", (table) => {
      table.string("sector"); // Sector 1..6 (București)
      table.string("status").defaultTo("FREE"); // FREE, RESERVED, OCCUPIED, MAINTENANCE
    })

    // 3. TENANTS (chiriași — firme cliente)
    .createTable("tenants", (table) => {
      table.increments("id").primary();
      // Legătura opțională cu un cont de login de tip 'client'
      table
        .integer("user_id")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
      table.string("company_name").notNullable();
      table.string("cui").notNullable().unique();
      table.string("reg_no");
      table.string("address");
      table.string("email");
      table.string("phone");
      table.string("legal_rep_name");
      table.string("status").defaultTo("PROSPECT"); // PROSPECT, ACTIVE, OVERDUE, INACTIVE
      table.timestamps(true, true);
    })

    // 4. CONTRACTS (contracte de închiriere)
    .createTable("contracts", (table) => {
      table.increments("id").primary();
      table.string("contract_number").notNullable().unique();
      table
        .integer("tenant_id")
        .notNullable()
        .references("id")
        .inTable("tenants")
        .onDelete("RESTRICT");
      table
        .integer("property_id")
        .notNullable()
        .references("id")
        .inTable("properties")
        .onDelete("RESTRICT");
      table
        .integer("employee_id")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
      table.date("start_date").notNullable();
      table.date("end_date").notNullable();
      table.decimal("monthly_rent_eur", 14, 2).notNullable();
      table.decimal("deposit_eur", 14, 2).defaultTo(0);
      table.integer("billing_day").defaultTo(1);
      table.decimal("utilities_ron", 14, 2).defaultTo(0); // utilități fixe lunare (RON)
      table.string("status").defaultTo("DRAFT"); // DRAFT, ACTIVE, EXPIRED, TERMINATED
      table.text("termination_reason");
      table.timestamps(true, true);
    })

    // 5. INVOICES (facturi lunare)
    .createTable("invoices", (table) => {
      table.increments("id").primary();
      table.string("invoice_number").notNullable().unique();
      table
        .integer("contract_id")
        .notNullable()
        .references("id")
        .inTable("contracts")
        .onDelete("CASCADE");
      table.date("issue_date").notNullable();
      table.date("due_date").notNullable();
      table.date("period_start");
      table.date("period_end");
      table.decimal("rent_eur", 14, 2).notNullable();
      table.decimal("bnr_rate", 10, 4).notNullable();
      table.decimal("rent_ron", 14, 2).notNullable();
      table.decimal("utilities_ron", 14, 2).defaultTo(0);
      table.decimal("vat_ron", 14, 2).defaultTo(0);
      table.decimal("total_ron", 14, 2).notNullable();
      table.date("paid_date");
      table.string("status").defaultTo("ISSUED"); // ISSUED, PAID, OVERDUE, CANCELLED
      table.timestamps(true, true);
    })

    // 6. MAINTENANCE_REQUESTS (intervenții tehnice)
    .createTable("maintenance_requests", (table) => {
      table.increments("id").primary();
      table
        .integer("property_id")
        .notNullable()
        .references("id")
        .inTable("properties")
        .onDelete("CASCADE");
      table
        .integer("employee_id")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
      table
        .integer("tenant_id")
        .references("id")
        .inTable("tenants")
        .onDelete("SET NULL"); // cine a raportat (dacă e client)
      table.text("description").notNullable();
      table.string("priority").defaultTo("MEDIUM"); // LOW, MEDIUM, HIGH, URGENT
      table.string("status").defaultTo("OPEN"); // OPEN, IN_PROGRESS, RESOLVED, CANCELLED
      table.timestamp("requested_at").defaultTo(knex.fn.now());
      table.timestamp("resolved_at");
      table.text("resolution_notes");
      table.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("maintenance_requests")
    .dropTableIfExists("invoices")
    .dropTableIfExists("contracts")
    .dropTableIfExists("tenants")
    .alterTable("properties", (table) => {
      table.dropColumn("sector");
      table.dropColumn("status");
    })
    .alterTable("users", (table) => {
      table.dropColumn("phone");
      table.dropColumn("active");
    });
};
