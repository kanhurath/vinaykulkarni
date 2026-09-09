const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const db       = require('../db');
const { verifyToken } = require('../middleware/verifyToken');
const { writeArticleSeoHtml, removeArticleSeoHtml } = require('../seoHtmlBuilder');

const router = express.Router();

// ── Image upload ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'articles');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) =>
    cb(null, `article-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Table setup ───────────────────────────────────────────────────────────────
async function ensureTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS article_categories (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(200) NOT NULL,
      slug        VARCHAR(200) NOT NULL UNIQUE,
      description TEXT,
      wp_id       INT UNSIGNED DEFAULT NULL,
      sort_order  INT DEFAULT 0,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      wp_id               INT UNSIGNED DEFAULT NULL,
      slug                VARCHAR(500) NOT NULL UNIQUE,
      status              ENUM('published','draft') DEFAULT 'draft',
      is_featured         TINYINT(1)   DEFAULT 0,
      title               TEXT         NOT NULL,
      excerpt             TEXT,
      content             LONGTEXT,
      featured_image_url  VARCHAR(1000) DEFAULT '',
      author_name         VARCHAR(200)  DEFAULT 'Vinay Kulkarni',
      pub_date            DATE          DEFAULT NULL,
      pub_date_display    VARCHAR(100)  DEFAULT '',
      categories          VARCHAR(1000) DEFAULT '',
      tags                VARCHAR(1000) DEFAULT '',
      seo_title           VARCHAR(300)  DEFAULT '',
      meta_description    VARCHAR(1000) DEFAULT '',
      og_image_url        VARCHAR(1000) DEFAULT '',
      canonical_url       VARCHAR(1000) DEFAULT '',
      sort_order          INT           DEFAULT 0,
      created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

ensureTables().catch(e => console.error('[articles] table init failed:', e.message));

async function ensureLikeCommentTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS article_likes (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      article_id  INT UNSIGNED NOT NULL,
      fingerprint VARCHAR(200) NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_like (article_id, fingerprint)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS article_comments (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      article_id   INT UNSIGNED NOT NULL,
      author_name  VARCHAR(200) DEFAULT 'Anonymous',
      content      TEXT         NOT NULL,
      image_url    VARCHAR(1000) DEFAULT '',
      status       ENUM('pending','approved') DEFAULT 'pending',
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_article (article_id),
      INDEX idx_status  (status)
    )
  `);
}
ensureLikeCommentTables().catch(e => console.error('[articles] like/comment table init failed:', e.message));

// Add FULLTEXT index on title+excerpt if not already present (safe to run each boot)
async function ensureFulltextIndex() {
  try {
    const [[{ cnt }]] = await db.execute(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = 'articles'
        AND INDEX_NAME   = 'ft_search'
    `);
    if (cnt === 0) {
      await db.execute(`ALTER TABLE articles ADD FULLTEXT INDEX ft_search (title, excerpt, tags)`);
    }
  } catch (e) {
    console.warn('[articles] FULLTEXT index setup skipped:', e.message);
  }
}
ensureFulltextIndex();

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Accepts any date string (ISO, YYYY-MM-DD, Date object) and returns
// 'YYYY-MM-DD' for MySQL DATE columns, or null if falsy / invalid.
function toMySqlDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d)) return null;
  return d.toISOString().split('T')[0];
}

// ── PUBLIC: list articles ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page, 10)     || 1);
    const per_page = Math.min(50, parseInt(req.query.per_page, 10) || 10);
    const category = (req.query.category || '').trim();
    const search   = (req.query.search   || '').trim();
    const status   = req.query.status || 'published';
    const offset   = (page - 1) * per_page;

    let where = 'WHERE a.status = ?';
    const params = [status];

    if (category) {
      where += ' AND FIND_IN_SET(?, REPLACE(a.categories, " ", ","))';
      params.push(category);
    }

    if (search) {
      // Use FULLTEXT MATCH for speed and relevance; fall back to LIKE on title
      // if the FULLTEXT index isn't ready yet (e.g. first boot).
      where += ' AND MATCH(a.title, a.excerpt, a.tags) AGAINST (? IN BOOLEAN MODE)';
      params.push(search);
    }

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM articles a ${where}`,
      params
    );

    // Title matches sort above excerpt/tag matches via MATCH score on title alone.
    // LIMIT / OFFSET must be interpolated as safe integers — mysql2 prepared
    // statement binding treats them as strings in some versions, causing
    // "Incorrect arguments to mysqld_stmt_execute".
    const orderBy = search
      ? `ORDER BY
           MATCH(a.title) AGAINST (? IN BOOLEAN MODE) DESC,
           a.is_featured DESC, a.pub_date DESC, a.sort_order, a.id DESC`
      : `ORDER BY a.is_featured DESC, a.pub_date DESC, a.sort_order, a.id DESC`;

    const rowParams = search ? [...params, search] : params;

    const [rows] = await db.execute(
      `SELECT a.* FROM articles a ${where} ${orderBy} LIMIT ${per_page} OFFSET ${offset}`,
      rowParams
    );

    res.json({
      articles:    rows,
      total:       Number(total),
      total_pages: Math.ceil(Number(total) / per_page),
      page,
      per_page,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: categories with counts ───────────────────────────────────────────
router.get('/categories', async (_req, res) => {
  try {
    const [cats] = await db.execute(
      'SELECT * FROM article_categories ORDER BY sort_order, name'
    );
    const [articles] = await db.execute(
      "SELECT categories FROM articles WHERE status='published'"
    );
    const counts = {};
    for (const a of articles) {
      (a.categories || '').split(/[\s,]+/).filter(Boolean).forEach(slug => {
        counts[slug] = (counts[slug] || 0) + 1;
      });
    }
    const result = cats.map(c => ({ ...c, count: counts[c.slug] || 0 }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: list all articles (including drafts) — before /:slug wildcard ──────
router.get('/admin/all', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM articles ORDER BY pub_date DESC, sort_order, id DESC'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: get single article by ID — before /:slug wildcard ─────────────────
router.get('/by-id/:id', verifyToken, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT * FROM articles WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: CKEditor inline image upload — before /:slug wildcard ─────────────
// Accepts a 'upload' field (CKEditor SimpleUploadAdapter convention).
// Returns { url } on success or { error: { message } } on failure.
router.post('/upload-image', verifyToken, upload.single('upload'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: { message: 'No file uploaded' } });
  const relativePath = `/uploads/articles/${req.file.filename}`;
  // Build an absolute URL that the browser can actually reach — use the
  // origin the request came from (works in both dev and production).
  const proto   = req.headers['x-forwarded-proto'] || req.protocol;
  const host    = req.headers['x-forwarded-host']  || req.get('host');
  const baseUrl = `${proto}://${host}`;
  res.json({ url: `${baseUrl}${relativePath}` });
});

// ── ADMIN: categories CRUD — before /:slug wildcard ──────────────────────────
router.get('/categories/all', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM article_categories ORDER BY sort_order, name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Likes: batch counts (before /:slug to avoid conflict) ────────────────────
router.get('/likes', async (req, res) => {
  const ids = (req.query.ids || '').split(',').map(Number).filter(Boolean);
  if (!ids.length) return res.json({ liked: [], counts: {} });
  try {
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await db.execute(
      `SELECT article_id, COUNT(*) AS cnt FROM article_likes WHERE article_id IN (${placeholders}) GROUP BY article_id`,
      ids
    );
    const counts = {};
    ids.forEach(id => { counts[id] = 0; });
    rows.forEach(r => { counts[r.article_id] = Number(r.cnt); });
    res.json({ counts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: likes summary ──────────────────────────────────────────────────────
router.get('/admin/likes', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT l.article_id, COUNT(*) AS count, a.title, a.slug
      FROM article_likes l
      LEFT JOIN articles a ON a.id = l.article_id
      GROUP BY l.article_id, a.title, a.slug
      ORDER BY count DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: set like count ─────────────────────────────────────────────────────
router.put('/admin/likes/:articleId', verifyToken, async (req, res) => {
  const n  = Math.max(0, parseInt(req.body.count, 10) || 0);
  const id = Number(req.params.articleId);
  try {
    await db.execute('DELETE FROM article_likes WHERE article_id=?', [id]);
    if (n > 0) {
      const placeholders = Array.from({ length: n }, () => '(?,?)').join(',');
      const values = Array.from({ length: n }, (_, i) => [id, `admin-seed-${i + 1}`]).flat();
      await db.execute(`INSERT INTO article_likes (article_id, fingerprint) VALUES ${placeholders}`, values);
    }
    res.json({ ok: true, count: n });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: clear likes ────────────────────────────────────────────────────────
router.delete('/admin/likes/:articleId', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM article_likes WHERE article_id=?', [Number(req.params.articleId)]);
    res.json({ cleared: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: list comments ──────────────────────────────────────────────────────
router.get('/admin/comments', verifyToken, async (req, res) => {
  try {
    let sql = `
      SELECT c.*, a.title AS article_title, a.slug AS article_slug
      FROM article_comments c
      LEFT JOIN articles a ON a.id = c.article_id
      WHERE 1=1
    `;
    const params = [];
    if (req.query.status)     { sql += ' AND c.status=?';     params.push(req.query.status); }
    if (req.query.article_id) { sql += ' AND c.article_id=?'; params.push(Number(req.query.article_id)); }
    sql += ' ORDER BY c.created_at DESC LIMIT 200';
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: add comment (with optional image) ──────────────────────────────────
const commentUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'comments');
fs.mkdirSync(commentUploadDir, { recursive: true });
const commentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, commentUploadDir),
  filename:    (_req, file,  cb) => cb(null, `comment-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
});
const commentUpload = multer({ storage: commentStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/admin/comments', verifyToken, commentUpload.single('image'), async (req, res) => {
  const { article_id, author_name = 'Admin', content = '', status = 'approved' } = req.body;
  if (!article_id) return res.status(400).json({ error: 'article_id required' });
  const image_url = req.file ? `/uploads/comments/${req.file.filename}` : (req.body.image_url || '');
  if (!content.trim() && !image_url) return res.status(400).json({ error: 'Comment text or image is required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO article_comments (article_id, author_name, content, image_url, status) VALUES (?,?,?,?,?)',
      [Number(article_id), author_name || 'Admin', content, image_url, status || 'approved']
    );
    res.status(201).json({ id: result.insertId, ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: edit comment ───────────────────────────────────────────────────────
router.put('/admin/comments/:id', verifyToken, commentUpload.single('image'), async (req, res) => {
  const { author_name, content, status } = req.body;
  const image_url = req.file ? `/uploads/comments/${req.file.filename}` : undefined;
  if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Comment text or image is required' });
  try {
    const fields = ['author_name=?', 'content=?', 'status=?'];
    const values = [author_name || 'Anonymous', content.trim(), status || 'approved'];
    if (image_url !== undefined) { fields.push('image_url=?'); values.push(image_url); }
    values.push(Number(req.params.id));
    await db.execute(`UPDATE article_comments SET ${fields.join(', ')} WHERE id=?`, values);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: approve comment ────────────────────────────────────────────────────
router.put('/admin/comments/:id/approve', verifyToken, async (req, res) => {
  try {
    await db.execute('UPDATE article_comments SET status=? WHERE id=?', ['approved', Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: delete comment ─────────────────────────────────────────────────────
router.delete('/admin/comments/:id', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM article_comments WHERE id=?', [Number(req.params.id)]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: toggle like ───────────────────────────────────────────────────────
router.post('/:id/like', async (req, res) => {
  const { fingerprint } = req.body;
  if (!fingerprint) return res.status(400).json({ error: 'fingerprint required' });
  const articleId = Number(req.params.id);
  try {
    const [[existing]] = await db.execute(
      'SELECT id FROM article_likes WHERE article_id=? AND fingerprint=?', [articleId, fingerprint]
    );
    if (existing) {
      await db.execute('DELETE FROM article_likes WHERE id=?', [existing.id]);
    } else {
      await db.execute('INSERT INTO article_likes (article_id, fingerprint) VALUES (?,?)', [articleId, fingerprint]);
    }
    const [[{ cnt }]] = await db.execute('SELECT COUNT(*) AS cnt FROM article_likes WHERE article_id=?', [articleId]);
    res.json({ liked: !existing, count: Number(cnt) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: get comments for article ─────────────────────────────────────────
router.get('/:id/comments', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, author_name, content, image_url, created_at FROM article_comments WHERE article_id=? AND status=? ORDER BY created_at ASC',
      [Number(req.params.id), 'approved']
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: submit comment ────────────────────────────────────────────────────
router.post('/:id/comments', async (req, res) => {
  const { author_name = 'Anonymous', content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comment text is required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO article_comments (article_id, author_name, content, status) VALUES (?,?,?,?)',
      [Number(req.params.id), author_name || 'Anonymous', content.trim(), 'pending']
    );
    res.status(201).json({ id: result.insertId, message: 'Comment submitted for review.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLIC: single article by slug ───────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const [[article]] = await db.execute(
      "SELECT * FROM articles WHERE slug = ? AND status = 'published'",
      [req.params.slug]
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // Fetch full category objects for this article
    const slugs = (article.categories || '').split(/[\s,]+/).filter(Boolean);
    let categories = [];
    if (slugs.length) {
      const placeholders = slugs.map(() => '?').join(',');
      const [cats] = await db.execute(
        `SELECT * FROM article_categories WHERE slug IN (${placeholders})`,
        slugs
      );
      categories = cats;
    }

    // Prev / Next for navigation
    const [[prev]] = await db.execute(
      "SELECT slug, title FROM articles WHERE status='published' AND pub_date < ? ORDER BY pub_date DESC LIMIT 1",
      [article.pub_date || '9999-12-31']
    );
    const [[next]] = await db.execute(
      "SELECT slug, title FROM articles WHERE status='published' AND pub_date > ? ORDER BY pub_date ASC LIMIT 1",
      [article.pub_date || '0000-01-01']
    );

    res.json({ article, categories, prev: prev || null, next: next || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: create article ─────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const {
    slug, status = 'draft', is_featured = 0, title, excerpt = '', content = '',
    featured_image_url = '', author_name = 'Vinay Kulkarni',
    pub_date = null, pub_date_display = '', categories = '', tags = '',
    seo_title = '', meta_description = '', og_image_url = '', canonical_url = '',
    sort_order = 0,
  } = req.body;

  if (!title) return res.status(400).json({ error: 'title is required' });

  const finalSlug  = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const safePubDate = toMySqlDate(pub_date);
  const pubDisplay  = pub_date_display || formatDisplayDate(safePubDate);

  try {
    const [r] = await db.execute(
      `INSERT INTO articles
       (slug,status,is_featured,title,excerpt,content,featured_image_url,author_name,
        pub_date,pub_date_display,categories,tags,seo_title,meta_description,
        og_image_url,canonical_url,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [finalSlug, status, is_featured ? 1 : 0, title, excerpt, content, featured_image_url,
       author_name, safePubDate, pubDisplay, categories, tags,
       seo_title, meta_description, og_image_url, canonical_url, sort_order]
    );
    const [[row]] = await db.execute('SELECT * FROM articles WHERE id=?', [r.insertId]);
    if (row.status === 'published') writeArticleSeoHtml(row);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: e.message });
  }
});

// ── ADMIN: reorder (before /:id so it doesn't match) ─────────────────────────
router.put('/reorder', verifyToken, async (req, res) => {
  const { items } = req.body;
  try {
    for (const { id, sort_order } of items) {
      await db.execute('UPDATE articles SET sort_order=? WHERE id=?', [sort_order, id]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: update article ─────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  const {
    slug, status, is_featured, title, excerpt, content, featured_image_url,
    author_name, pub_date, pub_date_display, categories, tags,
    seo_title, meta_description, og_image_url, canonical_url, sort_order,
  } = req.body;

  const safePubDate = toMySqlDate(pub_date);
  const pubDisplay  = pub_date_display || formatDisplayDate(safePubDate);

  try {
    await db.execute(
      `UPDATE articles SET
       slug=?,status=?,is_featured=?,title=?,excerpt=?,content=?,
       featured_image_url=?,author_name=?,pub_date=?,pub_date_display=?,
       categories=?,tags=?,seo_title=?,meta_description=?,
       og_image_url=?,canonical_url=?,sort_order=?
       WHERE id=?`,
      [slug, status, is_featured ? 1 : 0, title, excerpt || '', content || '',
       featured_image_url || '', author_name || 'Vinay Kulkarni',
       safePubDate, pubDisplay, categories || '', tags || '',
       seo_title || '', meta_description || '', og_image_url || '', canonical_url || '',
       sort_order || 0, req.params.id]
    );
    const [[row]] = await db.execute('SELECT * FROM articles WHERE id=?', [req.params.id]);
    if (row.status === 'published') writeArticleSeoHtml(row);
    else removeArticleSeoHtml(row.slug); // unpublished → remove stale pre-rendered file
    res.json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: e.message });
  }
});

// ── ADMIN: upload featured image ──────────────────────────────────────────────
router.post('/:id/image', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const image_url = `/uploads/articles/${req.file.filename}`;
  try {
    await db.execute('UPDATE articles SET featured_image_url=? WHERE id=?', [image_url, req.params.id]);
    const [[row]] = await db.execute('SELECT * FROM articles WHERE id=?', [req.params.id]);
    if (row.status === 'published') writeArticleSeoHtml(row);
    res.json({ image_url, article: row });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN: delete article ─────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT slug FROM articles WHERE id=?', [req.params.id]);
    await db.execute('DELETE FROM articles WHERE id=?', [req.params.id]);
    if (row) removeArticleSeoHtml(row.slug);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/categories', verifyToken, async (req, res) => {
  const { name, slug, description = '', sort_order = 0, wp_id = null } = req.body;
  try {
    const [r] = await db.execute(
      'INSERT INTO article_categories (name,slug,description,wp_id,sort_order) VALUES (?,?,?,?,?)',
      [name, slug, description, wp_id, sort_order]
    );
    const [[row]] = await db.execute('SELECT * FROM article_categories WHERE id=?', [r.insertId]);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/categories/:id', verifyToken, async (req, res) => {
  const { name, slug, description, sort_order } = req.body;
  try {
    await db.execute(
      'UPDATE article_categories SET name=?,slug=?,description=?,sort_order=? WHERE id=?',
      [name, slug, description || '', sort_order || 0, req.params.id]
    );
    const [[row]] = await db.execute('SELECT * FROM article_categories WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/categories/:id', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM article_categories WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
