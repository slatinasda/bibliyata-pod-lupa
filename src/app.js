require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const publicRoutes = require('./routes/public');
const adminAuthRoutes = require('./routes/adminAuth');
const adminDataRoutes = require('./routes/adminData');
const { securityHeaders } = require('./security');

const app = express();

// Зад прокси на Railway: взимаме истинския IP от X-Forwarded-For (нужно за лимитите по IP).
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(securityHeaders);

app.use(express.json({ limit: '100kb' }));

// Сайтът и API-то са на един origin, затова CORS е нужен само ако се добавят други домейни.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (allowedOrigins.length) app.use(cors({ origin: allowedOrigins }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', publicRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminDataRoutes);

// Сайтът и админ панелът (/admin/) са статични файлове в public/.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Последна защита: без stack trace в отговора.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

module.exports = app;
