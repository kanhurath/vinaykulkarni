const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// Auto-create table so the route works even if migrate.js hasn't been run
async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS page_seo (
      page_slug        VARCHAR(100) NOT NULL PRIMARY KEY,
      seo_title        VARCHAR(200) DEFAULT NULL,
      meta_description TEXT         DEFAULT NULL,
      focus_keyword    VARCHAR(200) DEFAULT NULL,
      canonical_url    VARCHAR(500) DEFAULT NULL,
      og_image_url     VARCHAR(500) DEFAULT NULL,
      custom_schema    LONGTEXT     DEFAULT NULL,
      updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
ensureTable().catch(e => console.error('[seo] table init failed:', e.message));

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'pages');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── GET /:slug ────────────────────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const [[row]] = await db.query('SELECT * FROM page_seo WHERE page_slug=?', [req.params.slug]);
    res.json(row || { page_slug: req.params.slug });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /:slug — upsert SEO settings ─────────────────────────────────────────
router.put('/:slug', verifyToken, async (req, res) => {
  const { seo_title, meta_description, focus_keyword, canonical_url, og_image_url, custom_schema } = req.body;
  try {
    await db.query(
      `INSERT INTO page_seo (page_slug, seo_title, meta_description, focus_keyword, canonical_url, og_image_url, custom_schema)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         seo_title=VALUES(seo_title), meta_description=VALUES(meta_description),
         focus_keyword=VALUES(focus_keyword), canonical_url=VALUES(canonical_url),
         og_image_url=VALUES(og_image_url), custom_schema=VALUES(custom_schema)`,
      [req.params.slug, seo_title||null, meta_description||null, focus_keyword||null,
       canonical_url||null, og_image_url||null, custom_schema||null]
    );
    const [[row]] = await db.query('SELECT * FROM page_seo WHERE page_slug=?', [req.params.slug]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /:slug/upload-image — OG image upload ───────────────────────────────
router.post('/:slug/upload-image', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/pages/${req.file.filename}` });
});

module.exports = router;
