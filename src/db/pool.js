const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. See .env.example.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Хостингът (Railway, Render) понякога изисква SSL, а локалната база го отхвърля: затова е явна настройка.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = { pool };
