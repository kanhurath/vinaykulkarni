const express = require('express');
const db      = require('../db');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

const SECTIONS = ['typography', 'colors', 'container', 'buttons', 'site-protection', 'global-css'];

const DEFAULTS = {
  typography: {
    bodyFont: 'Cormorant Garamond',
    headingFont: 'Josefin Sans',
    h1Size: '3.5', h1Unit: 'rem',
    h2Size: '2.5', h2Unit: 'rem',
    h3Size: '2.0', h3Unit: 'rem',
    h4Size: '1.5', h4Unit: 'rem',
    h5Size: '1.25', h5Unit: 'rem',
    h6Size: '1.0', h6Unit: 'rem',
    paragraphMarginBottom: '1', paragraphMarginUnit: 'em',
  },
  colors: {
    accent: '#d4670a',
    links: '#d4670a',
    headings: '#1a1208',
    bodyText: '#1a1208',
    borders: 'rgba(184,146,42,0.25)',
    siteBackground: '#faf6ee',
    contentBackground: '#f5edd8',
  },
  container: {
    layout: 'standard',
    style: 'unboxed',
    containerWidth: 1200,
    narrowWidth: 750,
  },
  'site-protection': {
    frontendProtection: false,
    adminProtection:    false,
  },
  'global-css': {
    css: '',
  },
  buttons: {
    textColor: '#ffffff',
    bgColor: '#d4670a',
    borderColor: 'transparent',
    font: 'Josefin Sans',
    paddingTop: '12', paddingRight: '28', paddingBottom: '12', paddingLeft: '28', paddingUnit: 'px',
    borderWidthTop: '0', borderWidthRight: '0', borderWidthBottom: '0', borderWidthLeft: '0',
    borderRadiusTop: '3', borderRadiusRight: '3', borderRadiusBottom: '3', borderRadiusLeft: '3', borderRadiusUnit: 'px',
  },
};

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS global_customizer (
      section    VARCHAR(50) PRIMARY KEY,
      settings   LONGTEXT    NOT NULL,
      updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}
ensureTable().catch(e => console.error('[customizer] table init failed:', e.message));

// GET /api/customizer — all sections merged with defaults
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT section, settings FROM global_customizer');
    const result = {};
    SECTIONS.forEach(s => { result[s] = { ...DEFAULTS[s] }; });
    rows.forEach(r => {
      try {
        const saved = JSON.parse(r.settings);
        result[r.section] = { ...DEFAULTS[r.section], ...saved };
      } catch (_) {}
    });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/customizer/:section
router.get('/:section', async (req, res) => {
  const { section } = req.params;
  if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'Unknown section' });
  try {
    const [[row]] = await db.execute('SELECT settings FROM global_customizer WHERE section=?', [section]);
    const saved = row ? JSON.parse(row.settings) : {};
    res.json({ ...DEFAULTS[section], ...saved });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/customizer/:section
router.put('/:section', verifyToken, async (req, res) => {
  const { section } = req.params;
  if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'Unknown section' });
  try {
    const data = JSON.stringify(req.body);
    await db.execute(
      `INSERT INTO global_customizer (section, settings) VALUES (?,?)
       ON DUPLICATE KEY UPDATE settings=VALUES(settings)`,
      [section, data]
    );
    res.json({ ...DEFAULTS[section], ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
