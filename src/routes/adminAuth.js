const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db/pool');
const { loginSchema } = require('../validation');
const { verifyTotp, lockState, recordFailure, clearFailures, sleep } = require('../security');

const router = express.Router();

// Забавя налучкването на парола: 10 опита за 15 минути от един IP (плюс 5 за акаунт, по-долу).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// Истински bcrypt хеш на случаен низ: грешен имейл струва същото време като грешна парола.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-' + Math.random(), 10);

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse({ email: req.body?.email, password: req.body?.password });
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const { email, password } = parsed.data;
  const code = req.body?.code;

  const lock = lockState(email);
  if (lock.locked) {
    res.set('Retry-After', String(lock.retryAfterSec));
    return res.status(429).json({ error: 'Too many failed attempts for this account. Try again later.' });
  }

  const fail = async () => {
    recordFailure(email);
    await sleep(600 + Math.floor(Math.random() * 400)); // забавя налучкването; еднакво съобщение за всяка причина
    return res.status(401).json({ error: 'Invalid credentials.' });
  };

  try {
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin ? admin.password_hash : DUMMY_HASH);
    if (!admin || !valid) return fail();

    // Двуфакторен вход: ако ADMIN_TOTP_SECRET е зададена, 6-цифреният код е задължителен.
    const secret = process.env.ADMIN_TOTP_SECRET;
    if (secret) {
      if (!code) return res.status(401).json({ error: 'Authenticator code required.', needsCode: true });
      if (!verifyTotp(secret, code)) return fail();
    }

    clearFailures(email);
    const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, expiresIn: '2h' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

module.exports = router;
