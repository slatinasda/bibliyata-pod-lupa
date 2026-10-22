// Прилага schema.sql към базата. Безопасно е да се пуска многократно: npm run migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Migration complete: schema applied.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
