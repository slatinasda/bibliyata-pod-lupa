// Нова празна тестова база преди всеки пуск (вика се от webServer.command в playwright.config.js).
const { Client } = require('pg');

(async () => {
  const name = process.env.E2E_DB_NAME;
  const c = new Client({ connectionString: process.env.E2E_ADMIN_URL });
  await c.connect();
  await c.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await c.query(`CREATE DATABASE ${name}`);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
