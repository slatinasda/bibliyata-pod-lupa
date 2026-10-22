// Публични крайни точки: програма на сезона, регистрация за вечер и контактна форма.
const express = require('express');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db/pool');
const { registerSchema, contactSchema, isEmail } = require('../validation');
const { SEASON, EPISODES, nextEpisode, findEpisode, sofiaToday } = require('../episodes');
const { notifyRegistration, notifyContact } = require('../email');

const router = express.Router();

// Защита от спам: по подразбиране 10 регистрации и 5 съобщения за 15 минути от един IP.
// RATE_LIMIT_MAX вдига и двата лимита (за автоматичните тестове).
const limit = (def) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || def,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Твърде много опити. Опитай пак след малко.' },
});

router.get('/season', (req, res) => {
  res.json({ season: SEASON, episodes: EPISODES, next: nextEpisode() });
});

// Скрито поле „website“: хората не го виждат, ботовете го попълват. Тогава връщаме „успех“, без да записваме.
const isBot = (body) => typeof body?.website === 'string' && body.website.trim() !== '';

const firstError = (parsed) => parsed.error.issues[0]?.message || 'Провери полетата.';

router.post('/register', limit(10), async (req, res) => {
  if (isBot(req.body)) return res.status(201).json({ ok: true });

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstError(parsed) });
  const data = parsed.data;

  const episode = findEpisode(data.episodeId);
  if (!episode) return res.status(400).json({ error: 'Избери епизод.' });
  if (episode.date < sofiaToday()) return res.status(400).json({ error: 'Този епизод вече мина. Избери следващ.' });

  const email = isEmail(data.contact) ? data.contact : '';
  const phone = email ? '' : data.contact;

  try {
    const { rows } = await pool.query(
      `INSERT INTO registrations (episode_id, name, phone, email, invited_by, first_time, help)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [episode.id, data.name, phone, email, data.invitedBy, data.firstTime, data.help]
    );
    // Неуспешен имейл не бива да срива заявката: записът вече е в базата и се вижда в админа.
    notifyRegistration({ ...data, phone, email }, episode).catch(() => {});
    res.status(201).json({ ok: true, id: rows[0].id, episode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Нещо се обърка. Опитай пак след малко.' });
  }
});

router.post('/contact', limit(5), async (req, res) => {
  if (isBot(req.body)) return res.status(201).json({ ok: true });

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstError(parsed) });
  const data = parsed.data;

  try {
    const { rows } = await pool.query(
      'INSERT INTO contact_submissions (name, email, message) VALUES ($1,$2,$3) RETURNING id',
      [data.name, data.email, data.message]
    );
    notifyContact(data).catch(() => {});
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Нещо се обърка. Опитай пак след малко.' });
  }
});

module.exports = router;
