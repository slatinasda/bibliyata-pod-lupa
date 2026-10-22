// Админ API: регистрациите и съобщенията от сайта. Всичко е зад requireAdmin.
const express = require('express');
const { pool } = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { REGISTRATION_STATUSES, CONTACT_STATUSES } = require('../validation');
const { findEpisode } = require('../episodes');

const router = express.Router();
router.use(requireAdmin);

const fail = (res, err, msg) => {
  console.error(err);
  res.status(500).json({ error: msg });
};

// GET /api/admin/stats : общи числа за таблото
router.get('/stats', async (req, res) => {
  try {
    const [total, byEpisode, contacts] = await Promise.all([
      pool.query(`SELECT count(*)::int AS total,
                         count(*) FILTER (WHERE status = 'new')::int AS new,
                         count(*) FILTER (WHERE first_time)::int AS first_time,
                         count(*) FILTER (WHERE cardinality(help) > 0)::int AS volunteers,
                         count(*) FILTER (WHERE invited_by <> '')::int AS invited
                  FROM registrations`),
      pool.query('SELECT episode_id, count(*)::int AS n FROM registrations GROUP BY episode_id ORDER BY episode_id'),
      pool.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'new')::int AS new FROM contact_submissions`),
    ]);
    res.json({ registrations: total.rows[0], byEpisode: byEpisode.rows, contacts: contacts.rows[0] });
  } catch (err) {
    fail(res, err, 'Failed to load stats.');
  }
});

// GET /api/admin/registrations?episode=3&status=new
router.get('/registrations', async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.episode) { params.push(Number(req.query.episode) || 0); where.push(`episode_id = $${params.length}`); }
  if (req.query.status) { params.push(String(req.query.status)); where.push(`status = $${params.length}`); }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM registrations ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC, id DESC`,
      params
    );
    res.json(rows.map((r) => ({ ...r, episode: findEpisode(r.episode_id) })));
  } catch (err) {
    fail(res, err, 'Failed to fetch registrations.');
  }
});

// PATCH /api/admin/registrations/:id : смяна на статуса
router.patch('/registrations/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!REGISTRATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${REGISTRATION_STATUSES.join(', ')}.` });
  }
  try {
    const { rows } = await pool.query('UPDATE registrations SET status = $1 WHERE id = $2 RETURNING *', [status, Number(req.params.id) || 0]);
    if (!rows.length) return res.status(404).json({ error: 'Registration not found.' });
    res.json(rows[0]);
  } catch (err) {
    fail(res, err, 'Failed to update registration.');
  }
});

router.delete('/registrations/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM registrations WHERE id = $1', [Number(req.params.id) || 0]);
    if (!rowCount) return res.status(404).json({ error: 'Registration not found.' });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err, 'Failed to delete registration.');
  }
});

// GET /api/admin/contacts?status=new
router.get('/contacts', async (req, res) => {
  const { status } = req.query;
  try {
    const { rows } = status
      ? await pool.query('SELECT * FROM contact_submissions WHERE status = $1 ORDER BY created_at DESC, id DESC', [String(status)])
      : await pool.query('SELECT * FROM contact_submissions ORDER BY created_at DESC, id DESC');
    res.json(rows);
  } catch (err) {
    fail(res, err, 'Failed to fetch submissions.');
  }
});

router.patch('/contacts/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!CONTACT_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${CONTACT_STATUSES.join(', ')}.` });
  }
  try {
    const { rows } = await pool.query('UPDATE contact_submissions SET status = $1 WHERE id = $2 RETURNING *', [status, Number(req.params.id) || 0]);
    if (!rows.length) return res.status(404).json({ error: 'Submission not found.' });
    res.json(rows[0]);
  } catch (err) {
    fail(res, err, 'Failed to update submission.');
  }
});

router.delete('/contacts/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM contact_submissions WHERE id = $1', [Number(req.params.id) || 0]);
    if (!rowCount) return res.status(404).json({ error: 'Submission not found.' });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err, 'Failed to delete submission.');
  }
});

module.exports = router;
