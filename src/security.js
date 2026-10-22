// Защита на админ панела и API: HTTP заглавия, TOTP (двуфакторен вход) и заключване след
// неуспешни опити за вход. Без допълнителни зависимости (само crypto от Node).
const crypto = require('crypto');

// ---- HTTP заглавия ----------------------------------------------------------------------------
function securityHeaders(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (req.path.startsWith('/admin')) {
    // Админът говори само със своя origin, не зарежда нищо отвън и не може да се вгражда.
    res.set('Content-Security-Policy',
      "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
      "connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
}

// ---- TOTP (RFC 6238): 6 цифри, стъпка 30 с, SHA-1 (Google Authenticator / Authy / 1Password) ----
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32decode(s) {
  const clean = String(s).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of clean) bits += B32.indexOf(ch).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function b32encode(buf) {
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}
function totpAt(secretB32, counter) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', b32decode(secretB32)).update(msg).digest();
  const o = h[h.length - 1] & 0x0f;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}
// Приема текущия код и по една стъпка отстрани (разлика в часовника). Сравнение с постоянно време.
function verifyTotp(secretB32, code, now = Date.now()) {
  const given = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(given)) return false;
  const step = Math.floor(now / 30000);
  let ok = false;
  for (const d of [-1, 0, 1]) {
    const want = totpAt(secretB32, step + d);
    if (crypto.timingSafeEqual(Buffer.from(want), Buffer.from(given))) ok = true;
  }
  return ok;
}
const newTotpSecret = () => b32encode(crypto.randomBytes(20));

// ---- заключване: 5 грешни опита за акаунт за 15 минути ----
const fails = new Map(); // email -> { n, first }
const WINDOW = 15 * 60 * 1000, MAX = 5;
function lockState(email) {
  const k = String(email).toLowerCase();
  const f = fails.get(k);
  if (!f) return { locked: false };
  if (Date.now() - f.first > WINDOW) { fails.delete(k); return { locked: false }; }
  return { locked: f.n >= MAX, retryAfterSec: Math.ceil((WINDOW - (Date.now() - f.first)) / 1000) };
}
function recordFailure(email) {
  const k = String(email).toLowerCase();
  const f = fails.get(k);
  if (!f || Date.now() - f.first > WINDOW) fails.set(k, { n: 1, first: Date.now() });
  else f.n++;
}
const clearFailures = (email) => fails.delete(String(email).toLowerCase());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { securityHeaders, verifyTotp, totpAt, newTotpSecret, lockState, recordFailure, clearFailures, sleep };
