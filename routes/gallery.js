const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');

const router = express.Router();

// ── Multer — gallery image uploads ───────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'gallery');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req,  file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// ── ALL — single fetch for the frontend ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.query('SELECT * FROM gal_hero LIMIT 1'),
      db.query('SELECT * FROM gal_images ORDER BY sort_order, id'),
    ]);
    const rows = (i) => results[i].status === 'fulfilled' ? results[i].value[0] : [];
    res.json({
      hero:   rows(0)[0] || {},
      images: rows(1),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HERO ──────────────────────────────────────────────────────────────────────
router.get('/hero', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gal_hero LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero', async (req, res) => {
  const { eyebrow, title, title_em, subtitle, breadcrumb } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM gal_hero LIMIT 1');
    if (ex.length) {
      await db.query(
        'UPDATE gal_hero SET eyebrow=?,title=?,title_em=?,subtitle=?,breadcrumb=? WHERE id=?',
        [eyebrow, title, title_em, subtitle, breadcrumb, ex[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO gal_hero (eyebrow,title,title_em,subtitle,breadcrumb) VALUES (?,?,?,?,?)',
        [eyebrow, title, title_em, subtitle, breadcrumb]
      );
    }
    const [rows] = await db.query('SELECT * FROM gal_hero LIMIT 1');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GALLERY IMAGES ────────────────────────────────────────────────────────────
router.get('/images', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gal_images ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create — JSON metadata only (image uploaded separately)
router.post('/images', async (req, res) => {
  const { cat, caption, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO gal_images (cat,caption,image_url,sort_order) VALUES (?,?,?,?)',
      [cat || 'iks', caption || '', '', sort_order || 0]
    );
    const [rows] = await db.query('SELECT * FROM gal_images WHERE id=?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update metadata
router.put('/images/:id', async (req, res) => {
  const { cat, caption, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE gal_images SET cat=?,caption=?,sort_order=? WHERE id=?',
      [cat || '', caption || '', sort_order || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM gal_images WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload / replace image file
router.post('/images/:id/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `/uploads/gallery/${req.file.filename}`;
  try {
    await db.query('UPDATE gal_images SET image_url=? WHERE id=?', [imageUrl, req.params.id]);
    res.json({ image_url: imageUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/images/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM gal_images WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
