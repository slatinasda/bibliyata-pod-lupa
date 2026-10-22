// E2E: стартира сървъра срещу отделна, всеки път нова тестова база и обхожда сайта и админа.
// Връзката за създаване на базата идва от TEST_ADMIN_DATABASE_URL (към базата "postgres"
// с право да създава бази); по подразбиране локалния Postgres на порт 5440 от README.
const { defineConfig, devices } = require('@playwright/test');

const PORT = 3100;
const TEST_DB = 'bibliyata_pod_lupa_test';
const ADMIN_URL = process.env.TEST_ADMIN_DATABASE_URL || 'postgresql://postgres@127.0.0.1:5440/postgres';
const TEST_DB_URL = new URL(ADMIN_URL);
TEST_DB_URL.pathname = '/' + TEST_DB;

process.env.E2E_BASE_URL = `http://127.0.0.1:${PORT}`;
process.env.E2E_ADMIN_URL = ADMIN_URL;
process.env.E2E_DB_NAME = TEST_DB;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45_000,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: { baseURL: process.env.E2E_BASE_URL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Нова празна база при всеки пуск; после сървърът сам прилага схемата и създава админа.
    command: 'node tests/reset-db.js && node src/server.js',
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      PORT: String(PORT),
      DATABASE_URL: TEST_DB_URL.toString(),
      DB_SSL: 'false',
      JWT_SECRET: 'e2e-only-secret-not-used-anywhere-else',
      SEED_ADMIN_EMAIL: 'e2e-admin@example.com',
      SEED_ADMIN_PASSWORD: 'e2e-test-password',
      RATE_LIMIT_MAX: '1000',
    },
  },
});
