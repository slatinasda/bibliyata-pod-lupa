require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const publicRoutes = require('./routes/public');
const adminAuthRoutes = require('./routes/adminAuth');
const adminDataRoutes = require('./routes/adminData');
const { securityHeaders } = require('./security');

const app = express();

// Зад прокси на Railway: взимаме истинския IP от X-Forwarded-For (нужно за лимитите по IP).
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Каноничният адрес е без www: www.<домейн> се пренасочва с 301 към https://<домейн> със същия път и параметри.
// Така има една версия на сайта за търсачките и AI, а връзките и сертификатът не се разминават.
const APEX = new URL(require('./seo').SITE).hostname;
app.use((req, res, next) => {
  const host = String(req.headers.host || '').toLowerCase().split(':')[0];
  if (host === `www.${APEX}`) return res.redirect(301, `https://${APEX}${req.originalUrl}`);
  next();
});
app.use(compression()); // по-малки страници и по-бърз сайт (Core Web Vitals)
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

// Откриваемост (SEO/GEO): началната страница се рендира със сървъра, за да виждат ботовете без JavaScript
// програмата, структурираните данни и FAQ; robots/sitemap/llms се генерират от същите данни (src/seo.js).
const seo = require('./seo');
const template = seo.loadTemplate();
const send = (type, cache) => (body) => (req, res) => {
  res.set({ 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': cache, 'Content-Language': 'bg' });
  res.send(typeof body === 'function' ? body() : body);
};
app.get('/', (req, res) => {
  res.set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Content-Language': 'bg' });
  res.send(seo.renderHome(template));
});
app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/robots.txt', send('text/plain', 'public, max-age=3600')(() => seo.robotsTxt()));
app.get('/sitemap.xml', send('application/xml', 'public, max-age=3600')(() => seo.sitemapXml(template.modified)));
app.get('/karta-na-sayta', send('text/html', 'public, max-age=300')(() => seo.sitemapPageHtml(template.modified)));
app.get('/poveritelnost', send('text/html', 'public, max-age=300')(() => seo.privacyPageHtml()));
app.get('/biskvitki', send('text/html', 'public, max-age=300')(() => seo.cookiesPageHtml()));
app.get('/llms.txt', send('text/plain', 'public, max-age=3600')(() => seo.llmsTxt()));
app.get('/llms-full.txt', send('text/plain', 'public, max-age=3600')(() => seo.llmsFull()));

// Сайтът и админ панелът (/admin/) са статични файлове в public/. Картинките се кешират за един ден (ETag при промяна).
// "/" вече е обработен по-горе, а за /admin/ статичният сървър връща admin/index.html и пренасочва /admin към /admin/.
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders(res, file) {
    if (/\.(webp|png|jpe?g|svg|ico)$/i.test(file)) res.set('Cache-Control', 'public, max-age=86400');
    else if (/\.(css|js)$/i.test(file)) res.set('Cache-Control', 'public, max-age=300');
  },
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Последна защита: без stack trace в отговора.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

module.exports = app;
