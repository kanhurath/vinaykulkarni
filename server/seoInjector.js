'use strict';

const fs  = require('fs');
const db  = require('./db');
const {
  buildArticleTags,
  buildPageTags,
  injectTags,
  DIST_HTML,
  SITE_URL,
} = require('./seoHtmlBuilder');

// Maps static URL paths to page_seo.page_slug values in the DB.
const PATH_TO_SLUG = {
  '/':             'home',
  '/biography':    'biography',
  '/teaching':     'teaching',
  '/videos':       'videos',
  '/connect':      'connect',
  '/events':       'events',
  '/news':         'news',
  '/gallery':      'gallery',
  '/workshops':    'workshops',
  '/testimonials': 'testimonials',
  '/articles':     'articles',
};

async function injectSeo(urlPath) {
  const template = fs.readFileSync(DIST_HTML, 'utf8');
  let tags = '';

  // ── Individual article page: /articles/:slug ─────────────────────────────
  const articleMatch = urlPath.match(/^\/articles\/([^/]+)\/?$/);
  if (articleMatch) {
    const slug = articleMatch[1];
    try {
      const [[article]] = await db.query(
        `SELECT slug, title, excerpt, seo_title, meta_description,
                og_image_url, featured_image_url, canonical_url,
                tags, pub_date, author_name
         FROM articles
         WHERE slug = ? AND status = 'published' LIMIT 1`,
        [slug]
      );
      if (article) {
        tags = buildArticleTags(article);
      } else {
        console.warn('[seo-injector] article not found for slug:', slug);
      }
    } catch (err) {
      console.error('[seo-injector] article query error for slug:', slug, err.message);
    }
  }

  // ── Static CMS page ───────────────────────────────────────────────────────
  if (!tags) {
    const pageSlug = PATH_TO_SLUG[urlPath] || null;
    if (pageSlug) {
      try {
        const [[row]] = await db.query(
          'SELECT * FROM page_seo WHERE page_slug = ?',
          [pageSlug]
        );
        if (row) tags = buildPageTags(row);
      } catch (err) {
        console.error('[seo-injector] page_seo query error for slug:', pageSlug, err.message);
      }
    }
  }

  // ── Fallback: generic site tags ───────────────────────────────────────────
  if (!tags) tags = buildPageTags({});

  return injectTags(template, tags);
}

module.exports = { injectSeo, PATH_TO_SLUG };
