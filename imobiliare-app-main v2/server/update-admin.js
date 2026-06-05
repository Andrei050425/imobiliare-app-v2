const knex = require('knex')(require('./knexfile').development);

async function run() {
  const trx = await knex.transaction();
  try {
    // Preluăm datele adminului vechi
    const oldAdmin = await trx('users').where({ id: 17 }).first();
    if (!oldAdmin) {
      console.log("Adminul vechi nu a fost găsit.");
      await trx.rollback();
      return;
    }
    
    // Verificăm dacă există deja user cu id 1
    const existing = await trx('users').where({ id: 1 }).first();
    if (existing) {
      console.log("User cu id=1 există deja.");
      await trx.rollback();
      return;
    }

    // Inserăm un utilizator temporar cu id 1
    await trx('users').insert({
      id: 1,
      full_name: oldAdmin.full_name,
      email: 'temp_1@santa.ro', // Temporar ca să nu apară eroare UNIQUE pe email
      password: oldAdmin.password,
      role: oldAdmin.role,
      created_at: oldAdmin.created_at,
      updated_at: oldAdmin.updated_at
    });

    // Actualizăm cheile externe în toate tabelele care fac referință la el
    await trx('properties').where({ user_id: 17 }).update({ user_id: 1 });
    await trx('tenants').where({ user_id: 17 }).update({ user_id: 1 });
    await trx('contracts').where({ employee_id: 17 }).update({ employee_id: 1 });
    await trx('offers').where({ user_id: 17 }).update({ user_id: 1 });
    await trx('maintenance_requests').where({ employee_id: 17 }).update({ employee_id: 1 });

    // Ștergem contul vechi
    await trx('users').where({ id: 17 }).del();

    // Actualizăm emailul pentru contul nou cu cel corect
    await trx('users').where({ id: 1 }).update({ email: oldAdmin.email });

    await trx.commit();
    console.log("SUCCES: Adminul are acum id-ul 1!");
  } catch (err) {
    await trx.rollback();
    console.error("Eroare la actualizare:", err);
  } finally {
    knex.destroy();
  }
}

run();
