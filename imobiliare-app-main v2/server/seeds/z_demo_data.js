const bcrypt = require("bcryptjs");
const { geocodeAddress } = require("../utils/geocoder");

/**
 * Seed cu date demonstrative pentru SANTA.
 * Rulează după init_categories (ordine alfabetică: i < z).
 * Conturi demo (parola = rolul + "123"):
 *   admin@santa.ro / admin123
 *   contabil@santa.ro / contabil123
 *   tehnic@santa.ro / tehnic123
 *   client@santa.ro / client123
 */
exports.seed = async function (knex) {
  // Curățăm în ordinea inversă a cheilor externe
  await knex("maintenance_requests").del();
  await knex("invoices").del();
  await knex("contracts").del();
  await knex("tenants").del();
  await knex("images").del();
  await knex("properties").del();
  await knex("users").del();

  const hash = (p) => bcrypt.hashSync(p, 10);

  // 1. UTILIZATORI (unul pentru fiecare rol)
  const [admin] = await knex("users")
    .insert({ full_name: "Andrei Dincă", email: "admin@santa.ro", password: hash("admin123"), role: "admin", phone: "0721000001", active: true })
    .returning("*");
  await knex("users").insert({ full_name: "Maria Ionescu", email: "contabil@santa.ro", password: hash("contabil123"), role: "contabil", phone: "0721000002", active: true });
  const [tehnic] = await knex("users")
    .insert({ full_name: "Ion Popescu", email: "tehnic@santa.ro", password: hash("tehnic123"), role: "tehnic", phone: "0721000003", active: true })
    .returning("*");
  const [clientUser] = await knex("users")
    .insert({ full_name: "Mobexpert Birou SRL", email: "client@santa.ro", password: hash("client123"), role: "client", phone: "0721000004", active: true })
    .returning("*");

  // 2. SPAȚII (portofoliu, pe sectoare)
  const spaces = [
    { title: "Spațiu comercial B-12", description: "Spațiu birou modern, etaj 2.", price: 1020, area: 85, address: "Bd. Unirii 24", sector: "Sector 3", status: "OCCUPIED", category_id: 1 },
    { title: "Magazin stradal Centru", description: "Vad comercial excelent.", price: 2160, area: 120, address: "Calea Victoriei 102", sector: "Sector 1", status: "FREE", category_id: 2 },
    { title: "Depozit logistic Vest", description: "Hală cu rampă de încărcare.", price: 2040, area: 340, address: "Șos. Alexandriei 210", sector: "Sector 5", status: "FREE", category_id: 3 },
    { title: "Birou Pipera Office", description: "Open space, mobilat.", price: 896, area: 64, address: "Bd. Pipera 1A", sector: "Sector 2", status: "FREE", category_id: 1 },
    { title: "Spațiu retail Dorobanți", description: "Zonă premium.", price: 2090, area: 95, address: "Calea Dorobanți 187", sector: "Sector 1", status: "RESERVED", category_id: 2 },
    { title: "Hală producție Berceni", description: "Spațiu industrial mare.", price: 2400, area: 480, address: "Șos. Berceni 55", sector: "Sector 4", status: "MAINTENANCE", category_id: 3 },
    { title: "Birou Crângași Compact", description: "Ideal startup.", price: 792, area: 72, address: "Calea Crângași 18", sector: "Sector 6", status: "FREE", category_id: 1 },
    { title: "Magazin Titan Plaza", description: "La parterul unui bloc.", price: 2100, area: 140, address: "Bd. 1 Decembrie 1918 33", sector: "Sector 3", status: "FREE", category_id: 2 },
  ];
  const insertedSpaces = [];
  for (const s of spaces) {
    const geo = await geocodeAddress(s.address, s.sector);
    const [row] = await knex("properties").insert({ ...s, latitude: geo.latitude, longitude: geo.longitude, user_id: admin.id }).returning("*");
    insertedSpaces.push(row);
  }

  // 3. CHIRIAȘ (legat de contul client)
  const [tenant] = await knex("tenants")
    .insert({
      user_id: clientUser.id,
      company_name: "SC Mobexpert Birou SRL",
      cui: "RO12345678",
      reg_no: "J40/1234/2015",
      address: "Bd. Unirii 24, București",
      email: "contact@mobexpert-birou.ro",
      phone: "0721000004",
      legal_rep_name: "George Marin",
      status: "ACTIVE",
    })
    .returning("*");

  // 4. CONTRACT activ pe spațiul ocupat (B-12)
  const occupied = insertedSpaces.find((s) => s.status === "OCCUPIED");
  const [contract] = await knex("contracts")
    .insert({
      contract_number: "CTR-2026-0001",
      tenant_id: tenant.id,
      property_id: occupied.id,
      employee_id: admin.id,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      monthly_rent_eur: 1020,
      deposit_eur: 2040,
      billing_day: 1,
      utilities_ron: 450,
      status: "ACTIVE",
    })
    .returning("*");

  // 5. FACTURI (una achitată, una emisă)
  await knex("invoices").insert([
    {
      invoice_number: "SANTA-2026-0001",
      contract_id: contract.id,
      issue_date: "2026-05-01",
      due_date: "2026-05-15",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      rent_eur: 1020,
      bnr_rate: 4.976,
      rent_ron: 5075.52,
      utilities_ron: 450,
      vat_ron: 1049.85,
      total_ron: 6575.37,
      paid_date: "2026-05-10",
      status: "PAID",
    },
    {
      invoice_number: "SANTA-2026-0002",
      contract_id: contract.id,
      issue_date: "2026-06-01",
      due_date: "2026-06-15",
      period_start: "2026-06-01",
      period_end: "2026-06-30",
      rent_eur: 1020,
      bnr_rate: 4.976,
      rent_ron: 5075.52,
      utilities_ron: 450,
      vat_ron: 1049.85,
      total_ron: 6575.37,
      status: "ISSUED",
    },
  ]);

  // 6. INTERVENȚIE tehnică
  await knex("maintenance_requests").insert({
    property_id: occupied.id,
    employee_id: tehnic.id,
    tenant_id: tenant.id,
    description: "Defecțiune sistem climatizare în sala de ședințe.",
    priority: "HIGH",
    status: "OPEN",
  });

  console.log("Seed demo SANTA inserat cu succes.");
};
