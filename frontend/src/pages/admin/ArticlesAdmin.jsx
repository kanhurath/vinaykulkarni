import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../services/articlesApi';
import ArticleRichEditor from './ArticleRichEditor';
import { SeoTab }          from './SeoTab';
import { SiteBlocksTab }   from './SiteBlocksTab';
import { SectionOrderTab } from './SectionOrderTab';
import { PublishToggle }   from '../../components/admin/PublishToggle';
import './BiographyAdmin.css';
import './ArticlesAdmin.css';

// ── Shared helpers ────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = 'text', rows, hint, placeholder, required }) {
  return (
    <div className="adm-field">
      <label className="adm-label">
        {label}{required && <span className="art-required">*</span>}
      </label>
      {rows
        ? <textarea className="adm-input adm-textarea" name={name} value={value || ''}
            rows={rows} onChange={onChange} placeholder={placeholder} />
        : <input className="adm-input" type={type} name={name} value={value || ''}
            onChange={onChange} placeholder={placeholder} />
      }
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

function SaveBar({ onSave, saving, saved, error }) {
  return (
    <div className="adm-save-bar">
      <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved  && <span className="adm-saved-msg">✓ Saved</span>}
      {error  && <span className="art-error-msg">{error}</span>}
    </div>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────────────
function CategoriesTab() {
  const [cats,    setCats]    = useState([]);
  const [form,    setForm]    = useState({ name: '', slug: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(() => {
    api.getAllCategories().then(setCats).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const autoSlug = (e) => {
    const name = e.target.value;
    setForm(f => ({
      ...f,
      name,
      slug: f.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  const save = async () => {
    if (!form.name || !form.slug) return setError('Name and slug are required');
    setSaving(true); setError('');
    try {
      if (editing) await api.updateCategory(editing, form);
      else         await api.createCategory(form);
      setForm({ name: '', slug: '', description: '' });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const edit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' });
  };

  const del = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await api.deleteCategory(id); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">{editing ? 'Edit Category' : 'Add Category'}</h2>

      <div className="art-form-grid">
        <Field label="Name" name="name" value={form.name}
          onChange={autoSlug} placeholder="Indian Knowledge Systems" required />
        <Field label="Slug" name="slug" value={form.slug}
          onChange={set} placeholder="iks"
          hint="URL-safe identifier used in filters" required />
      </div>
      <Field label="Description (optional)" name="description" value={form.description}
        onChange={set} rows={2} placeholder="Short description of this category" />

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Update Category' : 'Add Category'}
        </button>
        {editing && (
          <button className="adm-btn" onClick={() => {
            setEditing(null);
            setForm({ name: '', slug: '', description: '' });
          }}>
            Cancel
          </button>
        )}
        {error && <span className="art-error-msg">{error}</span>}
      </div>

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">All Categories</h3>

      {cats.length === 0 && (
        <p className="art-empty">No categories yet — add one above.</p>
      )}

      {cats.map(c => (
        <div key={c.id} className="art-cat-row">
          <div className="art-cat-info">
            <span className="art-cat-name">{c.name}</span>
            <code className="art-slug">{c.slug}</code>
            {c.count != null && <span className="art-count-badge">{c.count} articles</span>}
          </div>
          <div className="art-cat-actions">
            <button className="adm-btn adm-btn-sm" onClick={() => edit(c)}>Edit</button>
            <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => del(c.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Article Editor ────────────────────────────────────────────────────────────
function makeEmpty() {
  const today      = new Date();
  const pubDate    = today.toISOString().split('T')[0];
  const pubDisplay = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  return {
    slug: '', status: 'draft', is_featured: 1, title: '', excerpt: '', content: '',
    featured_image_url: '', author_name: 'Vinay Kulkarni',
    pub_date: pubDate, pub_date_display: pubDisplay, categories: '', tags: '',
    seo_title: '', meta_description: '', og_image_url: '', canonical_url: '',
    sort_order: 0,
  };
}

const EDITOR_TABS = [
  { id: 'content',  label: 'Content'  },
  { id: 'image',    label: 'Image'    },
  { id: 'seo',      label: 'SEO'      },
  { id: 'settings', label: 'Settings' },
];

// MySQL DATE columns come back from mysql2 as JS Date objects which
// JSON-serialise to ISO strings like "2026-07-14T18:30:00.000Z".
// The <input type="date"> requires "YYYY-MM-DD", so normalise here.
function normalisePubDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toISOString().split('T')[0];
}

function ArticleEditor({ article, categories, onSave, onCancel }) {
  const isNew = !article?.id;

  const [form,        setForm]        = useState(() => {
    const defaults = makeEmpty();
    return {
      ...defaults,
      ...article,
      pub_date:         isNew ? defaults.pub_date         : normalisePubDate(article?.pub_date),
      pub_date_display: isNew ? (article?.pub_date_display || defaults.pub_date_display)
                              : (article?.pub_date_display || ''),
    };
  });
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');
  const [imgFile,     setImgFile]     = useState(null);
  const [imgPrev,     setImgPrev]     = useState(article?.featured_image_url || '');
  const [tab,         setTab]         = useState('content');
  // Tracks which SEO fields the user has typed into manually — auto-sync skips those
  const [seoOverride, setSeoOverride] = useState(new Set());

  // Auto-sync SEO fields for new articles whenever their source fields change
  useEffect(() => {
    if (!isNew) return;
    setForm(f => ({
      ...f,
      ...(seoOverride.has('seo_title')        ? {} : { seo_title:        f.title }),
      ...(seoOverride.has('meta_description')  ? {} : { meta_description: f.excerpt }),
      ...(seoOverride.has('og_image_url')      ? {} : { og_image_url:     f.featured_image_url }),
      ...(seoOverride.has('canonical_url') || !f.slug
        ? {}
        : { canonical_url: `${window.location.origin}/articles/${f.slug}` }),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, form.title, form.excerpt, form.featured_image_url, form.slug, seoOverride]);

  const set = (e) => {
    const val = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  // Like set(), but marks the field as manually overridden so auto-sync stops for it
  const setSeo = (e) => {
    setSeoOverride(prev => new Set([...prev, e.target.name]));
    set(e);
  };

  const autoSlug = (e) => {
    const title = e.target.value;
    setForm(f => ({
      ...f,
      title,
      slug: f.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPrev(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!form.title) return setError('Title is required');
    setSaving(true); setSaved(false); setError('');
    try {
      let result = article?.id
        ? await api.updateArticle(article.id, form)
        : await api.createArticle(form);

      if (imgFile) {
        const res = await api.uploadArticleImage(result.id, imgFile);
        result = res.article;
        setForm(f => ({ ...f, featured_image_url: result.featured_image_url }));
        setImgPrev(api.resolveUploadUrl(result.featured_image_url));
        setImgFile(null);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSave?.(result);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-section">
      {/* Header */}
      <div className="art-editor-header">
        <h2 className="adm-section-title" style={{ margin: 0 }}>
          {article?.id ? 'Edit Article' : 'New Article'}
        </h2>
        <button className="adm-btn" onClick={onCancel}>← Back to List</button>
      </div>

      {/* Inner tab bar */}
      <div className="bio-adm-tabs" role="tablist" style={{ margin: '0 0 1.5rem' }}>
        {EDITOR_TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`bio-adm-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'content' && (
        <div className="adm-section">
          <Field label="Title" name="title" value={form.title} onChange={autoSlug} required />
          <Field label="Slug" name="slug" value={form.slug} onChange={set}
            hint="URL path: /articles/your-slug" />
          <Field label="Excerpt / Introduction" name="excerpt" value={form.excerpt}
            onChange={set} rows={3}
            hint="Short summary shown in article listings. Can contain HTML." />
          <div className="adm-field">
            <label className="adm-label">Full Content</label>
            <ArticleRichEditor
              value={form.content}
              onChange={(html) => setForm(f => ({ ...f, content: html }))}
              uploadUrl={api.getInlineImageUploadUrl()}
            />
            <p className="adm-hint">
              Use the toolbar to format text, insert images, tables, videos, code blocks, and more.
              Switch to <strong>Source</strong> view to edit raw HTML directly.
            </p>
          </div>
          <Field label="Author Name" name="author_name" value={form.author_name} onChange={set} />
          <div className="art-form-grid">
            <Field label="Publication Date" name="pub_date" value={form.pub_date}
              onChange={set} type="date" />
            <Field label="Display Date" name="pub_date_display" value={form.pub_date_display}
              onChange={set} placeholder="e.g. January 10, 2025"
              hint="Leave blank to auto-format from date above" />
          </div>
          <Field
            label="Categories (slugs, comma or space separated)"
            name="categories" value={form.categories} onChange={set}
            placeholder="iks dharma education"
            hint={`Available slugs: ${categories.map(c => c.slug).join(', ') || 'none yet — add categories first'}`}
          />
          <Field label="Tags (comma separated)" name="tags" value={form.tags}
            onChange={set} placeholder="Dharma, IKS, Education" />
        </div>
      )}

      {/* Image */}
      {tab === 'image' && (
        <div className="adm-section">
          {imgPrev && (
            <div className="art-img-preview">
              <img
                src={imgPrev.startsWith('blob:') ? imgPrev : api.resolveUploadUrl(imgPrev)}
                alt="Featured"
              />
            </div>
          )}
          <div className="adm-field">
            <label className="adm-label">Upload Image</label>
            <input type="file" accept="image/*" onChange={onFileChange} className="adm-file" />
            <p className="adm-hint">Max 10 MB · JPG, PNG, WebP. Recommended size: 1200 × 630 px.</p>
          </div>
          <Field label="Or paste an external image URL" name="featured_image_url"
            value={form.featured_image_url} onChange={(e) => {
              setForm(f => ({ ...f, featured_image_url: e.target.value }));
              setImgPrev(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
            hint="Use this for images hosted on WordPress or another server." />
        </div>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <div className="adm-section">
          {isNew && (
            <p className="adm-hint" style={{ marginBottom: '1rem' }}>
              SEO fields are auto-filled from your title, excerpt, and image. Edit any field to override it.
            </p>
          )}
          <Field label="SEO Title" name="seo_title" value={form.seo_title} onChange={setSeo}
            hint="Shown in browser tab and search results. Defaults to article title." />
          <Field label="Meta Description" name="meta_description" value={form.meta_description}
            onChange={setSeo} rows={3}
            hint="150–160 characters for search snippets." />
          <Field label="OG Image URL" name="og_image_url" value={form.og_image_url}
            onChange={setSeo} hint="Social share preview image. Defaults to featured image." />
          <Field label="Canonical URL" name="canonical_url" value={form.canonical_url}
            onChange={setSeo}
            hint="Full URL of the original source if this is an imported / republished article (e.g. the WordPress post URL)." />
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="adm-section">
          <div className="adm-field">
            <label className="adm-label">Status</label>
            <select className="adm-input" name="status" value={form.status} onChange={set}
              style={{ maxWidth: 220 }}>
              <option value="draft">Draft (hidden from public)</option>
              <option value="published">Published (visible to all)</option>
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label">Featured Article</label>
            <label className="art-checkbox-label">
              <input
                type="checkbox"
                name="is_featured"
                checked={!!form.is_featured}
                onChange={set}
              />
              Mark as featured (appears at top of article listing)
            </label>
          </div>
          <Field label="Sort Order" name="sort_order" value={form.sort_order}
            onChange={set} type="number"
            hint="Lower numbers appear first within the same date." />
        </div>
      )}

      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Articles List Tab ─────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

function ArticlesListTab({ categories }) {
  const [articles,  setArticles]  = useState([]);
  const [editing,   setEditing]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Search / filter / sort / pagination state
  const [search,    setSearch]    = useState('');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [sortBy,    setSortBy]    = useState('date_desc');
  const [page,      setPage]      = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    api.getAllArticles()
      .then(data => { setArticles(Array.isArray(data) ? data : []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, filterStatus, filterCategory, filterFeatured, sortBy]);

  const del = async (id) => {
    if (!confirm('Delete this article permanently?')) return;
    try { await api.deleteArticle(id); load(); }
    catch (e) { setError(e.message); }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (editing !== null) {
    return (
      <ArticleEditor
        article={editing}
        categories={categories}
        onSave={() => { setEditing(null); load(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  // ── Derived: filter → sort → paginate ──────────────────────────────────────
  const q = search.trim().toLowerCase();

  const filtered = articles.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterFeatured && !a.is_featured) return false;
    if (filterCategory !== 'all') {
      const cats = (a.categories || '').split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
      if (!cats.includes(filterCategory)) return false;
    }
    if (q) {
      const hay = `${a.title} ${a.slug} ${a.tags || ''} ${a.author_name || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':   return new Date(a.pub_date || 0) - new Date(b.pub_date || 0);
      case 'date_desc':  return new Date(b.pub_date || 0) - new Date(a.pub_date || 0);
      case 'title_asc':  return (a.title || '').localeCompare(b.title || '');
      case 'title_desc': return (b.title || '').localeCompare(a.title || '');
      case 'order':      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
      default:           return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setSearch(''); setFilterStatus('all'); setFilterCategory('all');
    setFilterFeatured(false); setSortBy('date_desc'); setPage(1);
  };

  const hasActiveFilters = q || filterStatus !== 'all' || filterCategory !== 'all' || filterFeatured;

  return (
    <div className="adm-section">
      {/* ── Header ── */}
      <div className="art-list-header">
        <h2 className="adm-section-title">
          All Articles
          <span className="art-list-count">{filtered.length} / {articles.length}</span>
        </h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setEditing({})}>
          + New Article
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="art-toolbar">
        {/* Search */}
        <div className="art-search-wrap">
          <span className="art-search-icon">⌕</span>
          <input
            className="art-search-input"
            type="search"
            placeholder="Search title, slug, tags, author…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="art-search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
          )}
        </div>

        {/* Status filter */}
        <select className="art-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        {/* Category filter */}
        <select className="art-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select className="art-filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="title_asc">Title A → Z</option>
          <option value="title_desc">Title Z → A</option>
          <option value="order">Sort Order</option>
        </select>

        {/* Featured toggle */}
        <label className="art-featured-toggle">
          <input
            type="checkbox"
            checked={filterFeatured}
            onChange={e => setFilterFeatured(e.target.checked)}
          />
          Featured only
        </label>

        {/* Reset */}
        {hasActiveFilters && (
          <button className="art-reset-btn" onClick={resetFilters}>✕ Reset</button>
        )}
      </div>

      {error && <p className="art-error-msg">{error}</p>}
      {loading && <p className="art-loading">Loading articles…</p>}

      {!loading && articles.length === 0 && (
        <p className="art-empty">No articles yet — click "New Article" to get started.</p>
      )}

      {!loading && articles.length > 0 && filtered.length === 0 && (
        <p className="art-empty">No articles match the current filters.</p>
      )}

      {/* ── Article rows ── */}
      <div className="art-list-rows">
        {paged.map(a => (
          <div key={a.id} className={`art-article-row${a.status === 'draft' ? ' draft' : ''}`}>
            <div className="art-article-info">
              {a.is_featured ? <span className="art-featured-star">★</span> : null}
              <div>
                <div className="art-article-title">{a.title}</div>
                <div className="art-article-meta">
                  <code className="art-slug">/articles/{a.slug}</code>
                  <span className={`art-status ${a.status}`}>{a.status}</span>
                  <span>{a.pub_date_display || fmtDate(a.pub_date)}</span>
                  {a.categories && <span className="art-meta-cats">{a.categories}</span>}
                </div>
              </div>
            </div>
            <div className="art-article-actions">
              <button className="adm-btn adm-btn-sm" onClick={() => setEditing(a)}>Edit</button>
              <a className="adm-btn adm-btn-sm" href={`/articles/${a.slug}`}
                target="_blank" rel="noreferrer">View</a>
              <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => del(a.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="art-pagination">
          <button
            className="art-page-btn"
            disabled={safePage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ‹ Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`art-page-btn${n === safePage ? ' active' : ''}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}

          <button
            className="art-page-btn"
            disabled={safePage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next ›
          </button>

          <span className="art-page-info">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Likes Tab ─────────────────────────────────────────────────────────────────
function LikesTab() {
  const [articles,    setArticles]    = useState([]);
  const [likesMap,    setLikesMap]    = useState({});
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [notDeployed, setNotDeployed] = useState(false);
  const [setVals,     setSetVals]     = useState({});
  const [addVals,     setAddVals]     = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(''); setNotDeployed(false);
    try {
      const arts = await api.getAllArticles();
      const rows = Array.isArray(arts) ? arts : (arts.articles || []);
      setArticles(rows);
      try {
        const ldata = await api.getAdminLikes();
        const map   = {};
        (Array.isArray(ldata) ? ldata : []).forEach(r => { map[r.article_id] = r.count; });
        setLikesMap(map);
      } catch (e) {
        if (e.message?.includes('404') || e.message?.includes('HTTP 404')) {
          setNotDeployed(true);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applySet = async (id, val) => {
    const n = Math.max(0, parseInt(val, 10) || 0);
    try {
      await api.setArticleLikeCount(id, n);
      setLikesMap(m => ({ ...m, [id]: n }));
    } catch (e) {
      if (e.message?.includes('404') || e.message?.includes('HTTP 404')) {
        setNotDeployed(true);
      } else {
        setError(e.message);
      }
    }
  };

  const applyAdd = async (id, val) => {
    const delta   = Math.max(0, parseInt(val, 10) || 0);
    const current = likesMap[id] || 0;
    await applySet(id, current + delta);
    setAddVals(v => ({ ...v, [id]: '' }));
  };

  const clear = async (id) => {
    if (!confirm('Clear all likes for this article?')) return;
    try {
      await api.clearArticleLikes(id);
      setLikesMap(m => ({ ...m, [id]: 0 }));
    } catch (e) {
      if (e.message?.includes('404') || e.message?.includes('HTTP 404')) {
        setNotDeployed(true);
      } else {
        setError(e.message);
      }
    }
  };

  const filtered = articles.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Article Likes</h2>
      {error && <p className="art-error-msg">{error}</p>}
      {notDeployed && (
        <div className="adm-deploy-banner">
          <strong>⚠ Server update required.</strong>
          <span>
            The likes API is not yet deployed on the production server.
            Upload the updated <code>articles.js</code> to the server and restart PM2 — see the guide below.
          </span>
          <a
            className="adm-btn adm-btn-sm adm-btn-primary"
            href="https://vinaykulkarni.com"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            Open cPanel / SSH
          </a>
        </div>
      )}
      <div className="adm-likes-toolbar">
        <input
          className="adm-input"
          type="search"
          placeholder="Search articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <button className="adm-btn" onClick={load}>Refresh</button>
      </div>
      {loading ? <p className="art-loading">Loading…</p> : (
        <table className="adm-likes-table">
          <thead>
            <tr>
              <th>Article</th>
              <th className="adm-likes-count-col">Likes</th>
              <th className="adm-likes-set-col">Set Count</th>
              <th className="adm-likes-set-col">Add Likes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                <td className="adm-likes-title">{a.title}</td>
                <td className="adm-likes-count-col adm-likes-count">{likesMap[a.id] || 0}</td>
                <td className="adm-likes-set-col">
                  <div className="adm-likes-inline">
                    <input
                      className="adm-input adm-likes-num-input"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={setVals[a.id] ?? ''}
                      onChange={e => setSetVals(v => ({ ...v, [a.id]: e.target.value }))}
                    />
                    <button
                      className="adm-btn adm-btn-sm adm-btn-primary"
                      onClick={() => applySet(a.id, setVals[a.id] ?? '')}
                    >Set</button>
                  </div>
                </td>
                <td className="adm-likes-set-col">
                  <div className="adm-likes-inline">
                    <input
                      className="adm-input adm-likes-num-input"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={addVals[a.id] ?? ''}
                      onChange={e => setAddVals(v => ({ ...v, [a.id]: e.target.value }))}
                    />
                    <button
                      className="adm-btn adm-btn-sm adm-btn-primary"
                      onClick={() => applyAdd(a.id, addVals[a.id] ?? '')}
                    >Add</button>
                  </div>
                </td>
                <td>
                  <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => clear(a.id)}>
                    Clear
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Comments Tab ──────────────────────────────────────────────────────────────
function CommentsTab() {
  const [comments,    setComments]    = useState([]);
  const [articles,    setArticles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [notDeployed, setNotDeployed] = useState(false);
  const [filterArt,   setFilterArt]   = useState('');
  const [filterSt,    setFilterSt]    = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ article_id: '', author_name: '', content: '', status: 'approved' });
  const [imageFile,   setImageFile]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const fileRef = useRef(null);

  const is404 = (e) => e.message?.includes('404') || e.message?.includes('HTTP 404');

  const load = useCallback(async () => {
    setLoading(true); setError(''); setNotDeployed(false);
    try {
      const params = {};
      if (filterArt) params.article_id = filterArt;
      if (filterSt)  params.status     = filterSt;
      const arts = await api.getAllArticles().catch(() => []);
      const artArr = Array.isArray(arts) ? arts : (arts.articles || []);
      setArticles(artArr);
      try {
        const rows = await api.getAdminComments(params);
        setComments(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (is404(e)) { setNotDeployed(true); setComments([]); }
        else throw e;
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterArt, filterSt]);

  useEffect(() => { load(); }, [load]);

  const [editingId,   setEditingId]   = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [editImage,   setEditImage]   = useState(null);
  const [editSaving,  setEditSaving]  = useState(false);
  const editFileRef = useRef(null);

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ author_name: c.author_name || '', content: c.content || '', status: c.status || 'approved' });
    setEditImage(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditImage(null); };

  const saveEdit = async (c) => {
    if (!editForm.content?.trim() && !editImage) return setError('Please enter comment text or upload an image.');
    setEditSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('author_name', editForm.author_name || '');
      fd.append('content',     editForm.content);
      fd.append('status',      editForm.status);
      if (editImage) fd.append('image', editImage);
      await api.updateComment(c.id, fd);
      setEditingId(null); setEditImage(null);
      load();
    } catch (e) {
      is404(e) ? setNotDeployed(true) : setError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  const approve = async (id) => {
    try { await api.approveComment(id); load(); }
    catch (e) { is404(e) ? setNotDeployed(true) : setError(e.message); }
  };

  const del = async (id) => {
    if (!confirm('Delete this comment?')) return;
    try { await api.deleteComment(id); load(); }
    catch (e) { is404(e) ? setNotDeployed(true) : setError(e.message); }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.article_id) return setError('Please select an article.');
    if (!form.content.trim() && !imageFile) return setError('Please enter comment text or upload an image.');
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      await api.adminAddComment(fd);
      setForm({ article_id: '', author_name: '', content: '', status: 'approved' });
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-section">
      <div className="art-list-header">
        <h2 className="adm-section-title">Comments</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Add Comment'}
        </button>
      </div>

      {error && <p className="art-error-msg">{error}</p>}
      {notDeployed && (
        <div className="adm-deploy-banner">
          <strong>⚠ Server update required.</strong>
          <span>The comments API is not yet deployed on the production server. Upload the updated <code>articles.js</code> and restart PM2 — see the guide below.</span>
        </div>
      )}

      {showForm && (
        <form className="adm-comment-form" onSubmit={submitForm}>
          <div className="art-form-grid">
            <div className="adm-field">
              <label className="adm-label">Article <span className="art-required">*</span></label>
              <select
                className="adm-input"
                value={form.article_id}
                onChange={e => setForm(f => ({ ...f, article_id: e.target.value }))}
                required
              >
                <option value="">— select article —</option>
                {articles.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">Author Name</label>
              <input className="adm-input" value={form.author_name}
                onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                placeholder="Admin" />
            </div>
          </div>
          <div className="adm-field">
            <label className="adm-label">Comment <span className="art-required">*</span></label>
            <textarea className="adm-input adm-textarea" rows={4} value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Comment text… (required if no image)" />
          </div>
          <div className="art-form-grid">
            <div className="adm-field">
              <label className="adm-label">Status</label>
              <select className="adm-input" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">Image (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" className="adm-input"
                onChange={e => setImageFile(e.target.files[0] || null)} />
            </div>
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add Comment'}
            </button>
          </div>
        </form>
      )}

      <div className="adm-likes-toolbar">
        <select className="adm-input" style={{ maxWidth: 220 }} value={filterArt}
          onChange={e => setFilterArt(e.target.value)}>
          <option value="">All Articles</option>
          {articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <select className="adm-input" style={{ maxWidth: 160 }} value={filterSt}
          onChange={e => setFilterSt(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
        <button className="adm-btn" onClick={load}>Refresh</button>
      </div>

      {loading ? <p className="art-loading">Loading…</p> : (
        comments.length === 0
          ? <p className="art-empty">No comments found.</p>
          : comments.map(c => (
            <div key={c.id} className={`adm-comment-row${editingId === c.id ? ' editing' : ''}`}>
              {/* ── View mode ── */}
              {editingId !== c.id && (<>
                <div className="adm-comment-meta">
                  <strong>{c.author_name || 'Anonymous'}</strong>
                  <span className={`art-status ${c.status}`}>{c.status}</span>
                  <span className="adm-comment-article">{c.article_title || `Article #${c.article_id}`}</span>
                  <span style={{ color: '#a09080', fontSize: '0.78rem' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : ''}
                  </span>
                </div>
                {c.image_url && (
                  <img src={c.image_url} alt="" className="adm-comment-img" />
                )}
                <p className="adm-comment-text">{c.content}</p>
                <div className="adm-comment-actions">
                  {c.status === 'pending' && (
                    <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => approve(c.id)}>
                      Approve
                    </button>
                  )}
                  <button className="adm-btn adm-btn-sm" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                  <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => del(c.id)}>
                    Delete
                  </button>
                </div>
              </>)}

              {/* ── Edit mode ── */}
              {editingId === c.id && (
                <div className="adm-comment-edit-form">
                  <div className="adm-comment-edit-header">
                    <span className="adm-comment-edit-title">Editing comment</span>
                    <span className="adm-comment-article">{c.article_title || `Article #${c.article_id}`}</span>
                  </div>
                  <div className="art-form-grid">
                    <div className="adm-field">
                      <label className="adm-label">Author Name</label>
                      <input
                        className="adm-input"
                        value={editForm.author_name}
                        onChange={e => setEditForm(f => ({ ...f, author_name: e.target.value }))}
                        placeholder="Anonymous"
                      />
                    </div>
                    <div className="adm-field">
                      <label className="adm-label">Status</label>
                      <select
                        className="adm-input"
                        value={editForm.status}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Comment <span className="art-required">*</span></label>
                    <textarea
                      className="adm-input adm-textarea"
                      rows={4}
                      value={editForm.content}
                      onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">
                      Replace Image <span style={{ fontWeight: 400, color: '#a09080' }}>(leave blank to keep existing)</span>
                    </label>
                    {c.image_url && !editImage && (
                      <img src={c.image_url} alt="" className="adm-comment-img" style={{ marginBottom: '0.4rem' }} />
                    )}
                    {editImage && (
                      <img src={URL.createObjectURL(editImage)} alt="preview" className="adm-comment-img" style={{ marginBottom: '0.4rem' }} />
                    )}
                    <input
                      ref={editFileRef}
                      type="file"
                      accept="image/*"
                      className="adm-input"
                      onChange={e => setEditImage(e.target.files[0] || null)}
                    />
                  </div>
                  <div className="adm-comment-edit-actions">
                    <button
                      className="adm-btn adm-btn-primary"
                      onClick={() => saveEdit(c)}
                      disabled={editSaving || (!editForm.content?.trim() && !editImage && !c.image_url)}
                    >
                      {editSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button className="adm-btn" onClick={cancelEdit} disabled={editSaving}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const PAGE_TABS = [
  { id: 'articles',   label: 'Articles'   },
  { id: 'categories', label: 'Categories' },
  { id: 'likes',      label: 'Likes'      },
  { id: 'comments',   label: 'Comments'   },
  { id: 'seo',        label: 'SEO'        },
  { id: 'blocks',     label: 'Blocks'     },
  { id: 'order',      label: 'Section Order' },
];

function ArticlesAdmin() {
  const [active,     setActive]     = useState('articles');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getAllCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Articles</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="articles" />
          <a href="/articles" target="_blank" rel="noreferrer" className="bio-adm-view-link">
            ↗ View Page
          </a>
        </div>
      </div>

      <div className="bio-adm-tabs" role="tablist">
        {PAGE_TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`bio-adm-tab${active === t.id ? ' active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bio-adm-content">
        {active === 'articles'   && <ArticlesListTab categories={categories} />}
        {active === 'categories' && <CategoriesTab />}
        {active === 'likes'      && <LikesTab />}
        {active === 'comments'   && <CommentsTab />}
        {active === 'seo'        && <SeoTab pageSlug="articles" />}
        {active === 'blocks'     && <SiteBlocksTab page="articles" />}
        {active === 'order'      && <SectionOrderTab page="articles" />}
      </div>
    </div>
  );
}

export default ArticlesAdmin;
