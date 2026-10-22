// Изпълнява се при старт: прилага schema.sql и създава админа от променливите на средата,
// така че нов деплой работи без ръчен `npm run migrate` / `seed:admin`.
// Грешка тук се логва, но не спира сървъра: формите продължават да работят, ако базата се върне.
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');
const { seedAdminFromEnv } = require('./seedAdmin');

async function ensureDatabase() {
  try {
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    const seeded = await seedAdminFromEnv();
    if (!seeded) console.warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: no admin account was created.');
  } catch (err) {
    console.error('Database ensure step failed:', err);
  }
}

module.exports = { ensureDatabase };
