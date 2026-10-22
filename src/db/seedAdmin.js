// Създава (или обновява паролата на) админа от SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
// Пуска се и автоматично при старт на сървъра (db/ensure.js). Ръчно: npm run seed:admin
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./pool');

async function upsertAdmin(email, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, passwordHash]
  );
}

async function seedAdminFromEnv() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return false;
  if (password.length < 8) {
    console.error('SEED_ADMIN_PASSWORD should be at least 8 characters.');
    return false;
  }
  await upsertAdmin(email, password);
  return true;
}

module.exports = { seedAdminFromEnv };

if (require.main === module) {
  seedAdminFromEnv()
    .then(async (ok) => {
      if (!ok) {
        console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 8 chars) before running this script.');
        process.exitCode = 1;
      } else {
        console.log(`Admin user ready: ${process.env.SEED_ADMIN_EMAIL}`);
      }
      await pool.end();
    })
    .catch((err) => {
      console.error('Failed to seed admin user:', err);
      process.exit(1);
    });
}
