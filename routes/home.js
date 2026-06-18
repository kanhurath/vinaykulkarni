const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');

const router = express.Router();

// ── Upload setup ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'home');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helpers ───────────────────────────────────────────────────────────────────
async function upsertSingle(table, data) {
  const [rows] = await db.query(`SELECT id FROM ${table} LIMIT 1`);
  const keys   = Object.keys(data);
  const vals   = Object.values(data);
  if (rows.length) {
    const set = keys.map(k => `${k}=?`).join(', ');
    await db.query(`UPDATE ${table} SET ${set} WHERE id=?`, [...vals, rows[0].id]);
    const [r] = await db.query(`SELECT * FROM ${table} WHERE id=?`, [rows[0].id]);
    return r[0];
  }
  const cols = keys.join(', ');
  const ph   = keys.map(() => '?').join(', ');
  const [res] = await db.query(`INSERT INTO ${table} (${cols}) VALUES (${ph})`, vals);
  const [r]   = await db.query(`SELECT * FROM ${table} WHERE id=?`, [res.insertId]);
  return r[0];
}

// ── GET /api/home/all — fetch all sections at once ────────────────────────────
router.get('/all', async (_req, res) => {
  try {
    const [[hero]]         = await db.query('SELECT * FROM home_hero LIMIT 1');
    const [marquee]        = await db.query('SELECT * FROM home_marquee_items ORDER BY sort_order');
    const [[about]]        = await db.query('SELECT * FROM home_about LIMIT 1');
    const [tags]           = await db.query('SELECT * FROM home_about_tags ORDER BY sort_order');
    const [articles]       = await db.query('SELECT * FROM home_articles ORDER BY sort_order');
    const [themes]         = await db.query('SELECT * FROM home_themes ORDER BY sort_order');
    const [[quote]]        = await db.query('SELECT * FROM home_quote LIMIT 1');
    const [talks]          = await db.query('SELECT * FROM home_talks ORDER BY sort_order');
    const [[connect]]      = await db.query('SELECT * FROM home_connect LIMIT 1');
    const [connectLinks]   = await db.query('SELECT * FROM home_connect_links ORDER BY sort_order');

    res.json({
      hero:    hero    || {},
      marquee: marquee || [],
      about:   { ...(about || {}), tags: tags || [] },
      articles: articles || [],
      themes:   themes   || [],
      quote:    quote    || {},
      talks:    talks    || [],
      connect:  { ...(connect || {}), links: connectLinks || [] },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [[row]] = await db.query('SELECT * FROM home_hero LIMIT 1');
    res.json(row || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', async (req, res) => {
  try { res.json(await upsertSingle('home_hero', req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── MARQUEE ───────────────────────────────────────────────────────────────────
router.get('/marquee', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home_marquee_items ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/marquee', async (req, res) => {
  const { item_text, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO home_marquee_items (item_text, sort_order) VALUES (?,?)', [item_text, sort_order || 0]);
    const [[row]] = await db.query('SELECT * FROM home_marquee_items WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/marquee/:id', async (req, res) => {
  const { item_text, sort_order } = req.body;
  try {
    await db.query('UPDATE home_marquee_items SET item_text=?, sort_order=? WHERE id=?', [item_text, sort_order, req.params.id]);
    const [[row]] = await db.query('SELECT * FROM home_marquee_items WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/marquee/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM home_marquee_items WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ABOUT ─────────────────────────────────────────────────────────────────────
router.get('/about', async (_req, res) => {
  try {
    const [[about]] = await db.query('SELECT * FROM home_about LIMIT 1');
    const [tags]    = await db.query('SELECT * FROM home_about_tags ORDER BY sort_order');
    res.json({ ...(about || {}), tags });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/about', async (req, res) => {
  const { heading1, heading_em, heading2, bio, quote } = req.body;
  try { res.json(await upsertSingle('home_about', { heading1, heading_em, heading2, bio, quote })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/about/tags', async (req, res) => {
  const { tag_text, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO home_about_tags (tag_text, sort_order) VALUES (?,?)', [tag_text, sort_order || 0]);
    const [[row]] = await db.query('SELECT * FROM home_about_tags WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/about/tags/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM home_about_tags WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/about/media', upload.single('media'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const mediaUrl = `/uploads/home/${req.file.filename}`;
  try {
    const [ex] = await db.query('SELECT id FROM home_about LIMIT 1');
    if (ex.length) {
      await db.query('UPDATE home_about SET media_url=? WHERE id=?', [mediaUrl, ex[0].id]);
    } else {
      await db.query('INSERT INTO home_about (media_url) VALUES (?)', [mediaUrl]);
    }
    res.json({ media_url: mediaUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ARTICLES ──────────────────────────────────────────────────────────────────
router.get('/articles', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home_articles ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/articles', async (req, res) => {
  const { featured, category, title, excerpt, pub_date, url, image_url, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO home_articles (featured,category,title,excerpt,pub_date,url,image_url,sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [featured||0, category, title, excerpt, pub_date, url, image_url||null, sort_order||0]
    );
    const [[row]] = await db.query('SELECT * FROM home_articles WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/articles/:id', async (req, res) => {
  const { featured, category, title, excerpt, pub_date, url, image_url, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE home_articles SET featured=?,category=?,title=?,excerpt=?,pub_date=?,url=?,image_url=?,sort_order=? WHERE id=?',
      [featured||0, category, title, excerpt, pub_date, url, image_url||null, sort_order||0, req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM home_articles WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/articles/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM home_articles WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/articles/:id/image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `/uploads/home/${req.file.filename}`;
  try {
    await db.query('UPDATE home_articles SET image_url=? WHERE id=?', [imageUrl, req.params.id]);
    res.json({ image_url: imageUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── THEMES ────────────────────────────────────────────────────────────────────
router.get('/themes', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home_themes ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/themes', async (req, res) => {
  const { theme_key, devanagari, name, description, count, sort_order, link_url } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO home_themes (theme_key,devanagari,name,description,count,sort_order,link_url) VALUES (?,?,?,?,?,?,?)',
      [theme_key, devanagari, name, description, count||0, sort_order||0, link_url||'']
    );
    const [[row]] = await db.query('SELECT * FROM home_themes WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/themes/:id', async (req, res) => {
  const { theme_key, devanagari, name, description, count, sort_order, link_url } = req.body;
  try {
    await db.query(
      'UPDATE home_themes SET theme_key=?,devanagari=?,name=?,description=?,count=?,sort_order=?,link_url=? WHERE id=?',
      [theme_key, devanagari, name, description, count||0, sort_order||0, link_url||'', req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM home_themes WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/themes/:id/icon', upload.single('icon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const iconUrl = `/uploads/home/${req.file.filename}`;
  try {
    await db.query('UPDATE home_themes SET icon_url=? WHERE id=?', [iconUrl, req.params.id]);
    res.json({ icon_url: iconUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/themes/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM home_themes WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── QUOTE ─────────────────────────────────────────────────────────────────────
router.get('/quote', async (_req, res) => {
  try {
    const [[row]] = await db.query('SELECT * FROM home_quote LIMIT 1');
    res.json(row || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/quote', async (req, res) => {
  const { quote_text, quote_attr, quote_mark_url, ornament_url } = req.body;
  try { res.json(await upsertSingle('home_quote', { quote_text, quote_attr, quote_mark_url, ornament_url })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TALKS ─────────────────────────────────────────────────────────────────────
router.get('/talks', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM home_talks ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/talks', async (req, res) => {
  const { label, title, youtube_id, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO home_talks (label,title,youtube_id,sort_order) VALUES (?,?,?,?)',
      [label, title, youtube_id, sort_order||0]
    );
    const [[row]] = await db.query('SELECT * FROM home_talks WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/talks/:id', async (req, res) => {
  const { label, title, youtube_id, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE home_talks SET label=?,title=?,youtube_id=?,sort_order=? WHERE id=?',
      [label, title, youtube_id, sort_order||0, req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM home_talks WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/talks/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM home_talks WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/talks/:id/thumb', upload.single('thumb'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const thumbUrl = `/uploads/home/${req.file.filename}`;
  try {
    await db.query('UPDATE home_talks SET thumb_url=? WHERE id=?', [thumbUrl, req.params.id]);
    res.json({ thumb_url: thumbUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CONNECT ───────────────────────────────────────────────────────────────────
router.get('/connect', async (_req, res) => {
  try {
    const [[connect]] = await db.query('SELECT * FROM home_connect LIMIT 1');
    const [links]     = await db.query('SELECT * FROM home_connect_links ORDER BY sort_order');
    res.json({ ...(connect || {}), links });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/connect', async (req, res) => {
  const { description } = req.body;
  try { res.json(await upsertSingle('home_connect', { description })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/connect/links', async (req, res) => {
  const { href, icon, label, sort_order } = req.body;
  try {
    const [r] = await db.query('INSERT INTO home_connect_links (href,icon,label,sort_order) VALUES (?,?,?,?)', [href, icon, label, sort_order||0]);
    const [[row]] = await db.query('SELECT * FROM home_connect_links WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/connect/links/:id', async (req, res) => {
  const { href, icon, label, sort_order } = req.body;
  try {
    await db.query('UPDATE home_connect_links SET href=?,icon=?,label=?,sort_order=? WHERE id=?', [href, icon, label, sort_order||0, req.params.id]);
    const [[row]] = await db.query('SELECT * FROM home_connect_links WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/connect/links/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM home_connect_links WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
