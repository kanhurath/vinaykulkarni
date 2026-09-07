import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/homeApi';
import { SiteBlocksTab } from './SiteBlocksTab';
import { SeoTab } from './SeoTab';
import { SectionOrderTab } from './SectionOrderTab';
import './HomeAdmin.css';
import { PublishToggle } from '../../components/admin/PublishToggle';

// ── Shared primitives ─────────────────────────────────────────────────────────

function Field({ label, name, value, onChange, type = 'text', rows, hint }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {rows ? (
        <textarea className="adm-input adm-textarea" name={name} value={value ?? ''} rows={rows} onChange={onChange} />
      ) : (
        <input className="adm-input" type={type} name={name} value={value ?? ''} onChange={onChange} />
      )}
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

function Row({ children }) {
  return <div className="adm-field-row">{children}</div>;
}

function SaveBar({ onSave, saving, saved, error }) {
  return (
    <div className="adm-save-bar">
      <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved  && <span className="adm-saved-msg">✓ Saved</span>}
      {error  && <span className="adm-saved-msg" style={{ color: '#c0392b' }}>⚠ {error}</span>}
    </div>
  );
}

function useSave(apiFn) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  const save = useCallback(async (data) => {
    setSaving(true); setSaved(false); setError('');
    try {
      await apiFn(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.message || 'Save failed — check server logs');
    } finally {
      setSaving(false);
    }
  }, [apiFn]);
  return { save, saving, saved, error };
}

// ── Tab: Hero ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [form, setForm] = useState({
    mantra:'', eyebrow:'', title_line1:'', title_em:'', title_line3:'',
    subtitle:'', cta1_text:'', cta1_link:'', cta2_text:'', cta2_link:'',
  });
  const { save, saving, saved, error } = useSave(api.updateHero);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/home/hero`)
      .then(r => r.json()).then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Hero Banner</h2>
      <p className="adm-hint">Controls the full-screen opening section with the canvas animation.</p>
      <Field label="Sanskrit Mantra (use \n for line break)" name="mantra"      value={form.mantra}      onChange={h} rows={3} />
      <Field label="Eyebrow Text"                            name="eyebrow"     value={form.eyebrow}     onChange={h} />
      <Row>
        <Field label="Title Line 1 (plain)"  name="title_line1" value={form.title_line1} onChange={h} />
        <Field label="Title Line 2 (italic)" name="title_em"    value={form.title_em}    onChange={h} />
        <Field label="Title Line 3 (plain)"  name="title_line3" value={form.title_line3} onChange={h} />
      </Row>
      <Field label="Subtitle" name="subtitle" value={form.subtitle} onChange={h} rows={2} />
      <Row>
        <Field label="CTA 1 Text" name="cta1_text" value={form.cta1_text} onChange={h} />
        <Field label="CTA 1 Link" name="cta1_link" value={form.cta1_link} onChange={h} />
      </Row>
      <Row>
        <Field label="CTA 2 Text" name="cta2_text" value={form.cta2_text} onChange={h} />
        <Field label="CTA 2 Link" name="cta2_link" value={form.cta2_link} onChange={h} />
      </Row>
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: Marquee ──────────────────────────────────────────────────────────────

function MarqueeTab() {
  const [items, setItems]   = useState([]);
  const [newText, setNewText] = useState('');

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/home/marquee`)
      .then(r => r.json()).then(setItems).catch(() => {}), []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const text = newText.trim();
    if (!text) return;
    await api.addMarqueeItem({ item_text: text, sort_order: items.length + 1 });
    setNewText('');
    load();
  };

  const del = async (id) => {
    if (!confirm('Remove this item?')) return;
    await api.deleteMarqueeItem(id);
    load();
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Marquee Strip</h2>
      <p className="adm-hint">The scrolling text banner below the hero. Items display in order.</p>
      <div className="adm-list">
        {items.map((item, i) => (
          <div key={item.id} className="adm-list-row">
            <span className="adm-list-num">{i + 1}</span>
            <span className="adm-list-text">{item.item_text}</span>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(item.id)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="adm-venue-add" style={{ marginTop: '1rem' }}>
        <input
          className="adm-input adm-input-sm"
          placeholder="Add new item…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={add}>Add</button>
      </div>
    </div>
  );
}

// ── Tab: About ────────────────────────────────────────────────────────────────

function AboutTab() {
  const [form,           setForm]          = useState({ heading1:'', heading_em:'', heading2:'', bio:'', quote:'', journey_btn_text:'' });
  const [tags,           setTags]          = useState([]);
  const [newTag,         setNewTag]        = useState('');
  const [mediaUrl,       setMediaUrl]      = useState('');
  const [localPreview,   setLocalPreview]  = useState(null);
  const [uploading,      setUploading]     = useState(false);
  const [uploadError,    setUploadError]   = useState('');
  const [pdfUrl,         setPdfUrl]        = useState('');
  const [pdfUploading,   setPdfUploading]  = useState(false);
  const [pdfUploadMsg,   setPdfUploadMsg]  = useState('');
  const { save, saving, saved, error }  = useSave(api.updateAbout);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'https://vinaykulkarni.com';

  const load = useCallback(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/home/about`)
      .then(r => r.json())
      .then(d => {
        setForm({ heading1: d.heading1||'', heading_em: d.heading_em||'', heading2: d.heading2||'', bio: d.bio||'', quote: d.quote||'', journey_btn_text: d.journey_btn_text||'' });
        setTags(d.tags || []);
        setMediaUrl(d.media_url || '');
        setPdfUrl(d.journey_pdf_url || '');
      })
      .catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local blob preview immediately so the user can see what was selected
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    setUploadError('');
    setUploading(true);

    try {
      const { media_url } = await api.uploadAboutMedia(file);
      setMediaUrl(media_url);    // server path confirmed
      setLocalPreview(null);     // server URL now takes over
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Upload failed — keep local preview visible but show the error
      setUploadError(
        'Upload failed. Make sure you have run the database migration: ' +
        'ALTER TABLE home_about ADD COLUMN IF NOT EXISTS media_url VARCHAR(500) NOT NULL DEFAULT \'\';'
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    setPdfUploadMsg('');
    try {
      const { pdf_url } = await api.uploadJourneyPdf(file);
      setPdfUrl(pdf_url);
      setPdfUploadMsg('success');
    } catch {
      setPdfUploadMsg('error');
    } finally {
      setPdfUploading(false);
    }
  };

  const addTag = async () => {
    const text = newTag.trim();
    if (!text) return;
    await api.addAboutTag({ tag_text: text, sort_order: tags.length + 1 });
    setNewTag('');
    load();
  };

  const delTag = async (id) => {
    if (!confirm('Remove tag?')) return;
    await api.deleteAboutTag(id);
    load();
  };

  // Priority: local blob preview (during/after failed upload) → server URL → nothing
  const displaySrc = localPreview
    || (mediaUrl ? (mediaUrl.startsWith('http') ? mediaUrl : `${SERVER}${mediaUrl}`) : null);

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">About Section</h2>

      {/* ── Media Image ── */}
      <div className="adm-photo-row">
        {displaySrc && (
          <img src={displaySrc} alt="About media" className="adm-photo-preview"
            style={{ width: '110px', height: '130px', objectFit: 'cover' }} />
        )}
        <div>
          <label className="adm-label">About Media Image</label>
          <input type="file" accept="image/*" className="adm-file" onChange={handleMediaUpload} />
          {uploading && <p className="adm-hint">Uploading…</p>}
          {uploadError && (
            <p className="adm-hint" style={{ color: '#c0392b', marginTop: '0.4rem' }}>
              ⚠ {uploadError}
            </p>
          )}
          {!uploading && !uploadError && mediaUrl && (
            <p className="adm-hint">✓ Saved: {mediaUrl}</p>
          )}
          {!uploading && !uploadError && !mediaUrl && (
            <p className="adm-hint">No image uploaded — the bundled default photo is used.</p>
          )}
        </div>
      </div>

      {/* ── Journey PDF ── */}
      <div className="adm-photo-row" style={{ marginTop: '1.25rem' }}>
        <div>
          <label className="adm-label">Journey PDF ("Explore Vinay's Journey" modal)</label>
          <input type="file" accept="application/pdf" className="adm-file" onChange={handlePdfUpload} />
          {pdfUploading && <p className="adm-hint">Uploading…</p>}
          {!pdfUploading && pdfUploadMsg === 'success' && <p className="adm-hint">✓ PDF uploaded: {pdfUrl}</p>}
          {!pdfUploading && pdfUploadMsg === 'error'   && <p className="adm-hint" style={{ color:'#c0392b' }}>⚠ Upload failed.</p>}
          {!pdfUploading && !pdfUploadMsg && pdfUrl    && <p className="adm-hint">Current: {pdfUrl}</p>}
          {!pdfUploading && !pdfUploadMsg && !pdfUrl   && <p className="adm-hint">No PDF uploaded — the bundled default is used.</p>}
        </div>
      </div>

      <Field
        label="Journey Button Text"
        name="journey_btn_text"
        value={form.journey_btn_text}
        onChange={h}
        hint={`Label shown on the button below the photo. Default: "Explore Vinay's Journey"`}
      />

      <hr className="adm-divider" />

      <Row>
        <Field label="Heading (plain)"  name="heading1"   value={form.heading1}   onChange={h} />
        <Field label="Heading (italic)" name="heading_em" value={form.heading_em} onChange={h} />
        <Field label="Heading Line 2"   name="heading2"   value={form.heading2}   onChange={h} />
      </Row>
      <Field label="Biography" name="bio"   value={form.bio}   onChange={h} rows={6} />
      <Field label="Quote"     name="quote" value={form.quote} onChange={h} rows={3} />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} error={error} />

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Tags</h3>
      <div className="adm-tags-wrap">
        {tags.map(t => (
          <span key={t.id} className="adm-tag-chip">
            {t.tag_text}
            <button onClick={() => delTag(t.id)}>×</button>
          </span>
        ))}
      </div>
      <div className="adm-venue-add" style={{ marginTop: '0.75rem' }}>
        <input className="adm-input adm-input-sm" placeholder="Add tag…" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} />
        <button className="adm-btn adm-btn-sm" onClick={addTag}>Add</button>
      </div>
    </div>
  );
}

// ── Tab: Articles ─────────────────────────────────────────────────────────────

const EMPTY_ARTICLE = { featured: 0, category: '', title: '', excerpt: '', pub_date: '', url: '', sort_order: 0 };

function ArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [editId,   setEditId]   = useState(null);
  const [adding,   setAdding]   = useState(false);
  const [newA,     setNewA]     = useState(EMPTY_ARTICLE);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'https://vinaykulkarni.com';

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/home/articles`)
      .then(r => r.json()).then(setArticles).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveEdit = async (a) => { await api.updateArticle(a.id, a); setEditId(null); load(); };
  const del      = async (id) => { if (!confirm('Delete article?')) return; await api.deleteArticle(id); load(); };
  const saveNew  = async () => { await api.addArticle(newA); setNewA(EMPTY_ARTICLE); setAdding(false); load(); };
  // Return the server response so ArticleEditBlock can sync form.image_url immediately.
  const uploadImg = async (id, file) => { const result = await api.uploadArticleImage(id, file); load(); return result; };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Articles</h2>
        <button className="adm-btn adm-btn-primary" onClick={() => setAdding(a => !a)}>{adding ? 'Cancel' : '+ Add Article'}</button>
      </div>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Article</h3>
          <ArticleForm form={newA} setForm={setNewA} />
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {articles.map(a => (
        <div key={a.id} className="adm-card-block">
          <div className="adm-card-header">
            {a.featured ? <span className="adm-badge-pill">Featured</span> : null}
            <span className="adm-card-title">{a.title}</span>
            <span className="adm-hint">{a.pub_date}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === a.id ? null : a.id)}>{editId === a.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(a.id)}>Delete</button>
          </div>
          {editId === a.id && (
            <div className="adm-card-edit-form">
              <ArticleEditBlock article={a} onSave={saveEdit} onCancel={() => setEditId(null)} onImageUpload={uploadImg} serverBase={SERVER} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ArticleForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Row>
        <Field label="Category"    name="category"   value={form.category}   onChange={h} />
        <Field label="Date"        name="pub_date"   value={form.pub_date}   onChange={h} />
        <Field label="Sort Order"  name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
      <Field label="Title"   name="title"   value={form.title}   onChange={h} />
      <Field label="Excerpt" name="excerpt" value={form.excerpt} onChange={h} rows={3} />
      <Field label="URL"     name="url"     value={form.url}     onChange={h} type="url" />
      <div className="adm-field">
        <label className="adm-label">Featured</label>
        <select className="adm-input" name="featured" value={form.featured} onChange={e => setForm(f => ({ ...f, featured: Number(e.target.value) }))}>
          <option value={0}>No</option>
          <option value={1}>Yes</option>
        </select>
      </div>
    </>
  );
}

function ArticleEditBlock({ article, onSave, onCancel, onImageUpload, serverBase }) {
  const [form, setForm] = useState({ ...article });

  // Keep form.image_url in sync when the parent refreshes the article prop after upload.
  useEffect(() => {
    setForm(f => ({ ...f, image_url: article.image_url }));
  }, [article.image_url]);

  const imgSrc = form.image_url
    ? (form.image_url.startsWith('http') ? form.image_url : `${serverBase}${form.image_url}`)
    : null;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onImageUpload(article.id, file);
    // Sync form immediately so Save sends the correct image_url.
    if (result?.image_url) setForm(f => ({ ...f, image_url: result.image_url }));
  };

  return (
    <>
      <ArticleForm form={form} setForm={setForm} />
      <div className="adm-field">
        <label className="adm-label">Featured Image</label>
        {imgSrc && <img src={imgSrc} alt="" className="adm-article-img-preview" />}
        <input type="file" accept="image/*" className="adm-file" onChange={handleImageChange} />
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}

// ── Tab: Themes ───────────────────────────────────────────────────────────────

const EMPTY_THEME = { theme_key: '', devanagari: '', name: '', description: '', count: 0, sort_order: 0 };

function ThemesTab() {
  const [themes,       setThemes]       = useState([]);
  const [editId,       setEditId]       = useState(null);
  const [adding,       setAdding]       = useState(false);
  const [newT,         setNewT]         = useState(EMPTY_THEME);
  const [newIconFile,  setNewIconFile]  = useState(null);
  const [newIconPreview, setNewIconPreview] = useState(null);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'https://vinaykulkarni.com';

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/home/themes`)
      .then(r => r.json()).then(setThemes).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveEdit   = async (t) => { await api.updateTheme(t.id, t); setEditId(null); load(); };
  const del        = async (id) => { if (!confirm('Delete theme?')) return; await api.deleteTheme(id); load(); };
  const saveNew    = async () => {
    const created = await api.addTheme(newT);
    if (newIconFile && created?.id) await api.uploadThemeIcon(created.id, newIconFile);
    setNewT(EMPTY_THEME);
    setNewIconFile(null);
    setNewIconPreview(null);
    setAdding(false);
    load();
  };
  // Return result so ThemeEditBlock can sync form.icon_url immediately (avoids Save overwriting it).
  const uploadIcon = async (id, file) => { const result = await api.uploadThemeIcon(id, file); load(); return result; };

  const handleNewIcon = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewIconFile(file);
    setNewIconPreview(URL.createObjectURL(file));
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Themes</h2>
        <button className="adm-btn adm-btn-primary"
          onClick={() => { setAdding(a => !a); setNewIconFile(null); setNewIconPreview(null); }}>
          {adding ? 'Cancel' : '+ Add Theme'}
        </button>
      </div>
      <p className="adm-hint">
        Built-in SVG icons display automatically for the keys: <strong>dharma, iks, education, psychology</strong>.
        Upload a custom icon (SVG, PNG, WEBP) to override any theme's icon.
      </p>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Theme</h3>
          <ThemeForm form={newT} setForm={setNewT} />
          <div className="adm-field">
            <label className="adm-label">Theme Icon (SVG, PNG, WEBP — optional)</label>
            <div className="adm-photo-row" style={{ padding: '0.75rem' }}>
              {newIconPreview && (
                <img src={newIconPreview} alt="Icon preview"
                  style={{ width: '56px', height: '56px', objectFit: 'contain', background: '#f3b33e', borderRadius: '50%', padding: '8px', flexShrink: 0 }} />
              )}
              <div>
                <input type="file" accept="image/svg+xml,image/png,image/webp,image/jpeg" className="adm-file" onChange={handleNewIcon} />
                <p className="adm-hint">Leave empty to use the built-in SVG for the theme key above.</p>
              </div>
            </div>
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {themes.map(t => (
        <div key={t.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{t.theme_key}</span>
            <span className="adm-card-title">{t.devanagari} {t.name}</span>
            <span className="adm-hint">{t.count} articles</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === t.id ? null : t.id)}>{editId === t.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(t.id)}>Delete</button>
          </div>
          {editId === t.id && (
            <div className="adm-card-edit-form">
              <ThemeEditBlock
                theme={t}
                onSave={saveEdit}
                onCancel={() => setEditId(null)}
                onIconUpload={uploadIcon}
                serverBase={SERVER}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ThemeForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Row>
        <Field label="Theme Key (e.g. dharma)" name="theme_key"  value={form.theme_key}  onChange={h} />
        <Field label="Devanagari"               name="devanagari" value={form.devanagari} onChange={h} />
        <Field label="Article Count"            name="count"      value={form.count}      onChange={h} type="number" />
      </Row>
      <Field label="Name"        name="name"        value={form.name}        onChange={h} />
      <Field label="Description" name="description" value={form.description} onChange={h} rows={3} />
      <Field label="Card Link URL" name="link_url" value={form.link_url || ''} onChange={h}
        hint='Internal path (e.g. /articles?category=Dharma) or external URL. Leave empty to use the built-in category mapping.' />
      <Field label="Sort Order"  name="sort_order"  value={form.sort_order}  onChange={h} type="number" />
    </>
  );
}

function ThemeEditBlock({ theme, onSave, onCancel, onIconUpload, serverBase }) {
  const [form, setForm] = useState({ ...theme });

  // Keep form.icon_url in sync if the parent refreshes after upload.
  useEffect(() => {
    setForm(f => ({ ...f, icon_url: theme.icon_url }));
  }, [theme.icon_url]);

  const iconSrc = form.icon_url
    ? (form.icon_url.startsWith('http') ? form.icon_url : `${serverBase}${form.icon_url}`)
    : null;

  const handleIconChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onIconUpload(theme.id, file);
    if (result?.icon_url) setForm(f => ({ ...f, icon_url: result.icon_url }));
  };

  return (
    <>
      <ThemeForm form={form} setForm={setForm} />

      <div className="adm-field">
        <label className="adm-label">Theme Icon (SVG, PNG, WEBP)</label>
        <div className="adm-photo-row" style={{ padding: '0.75rem' }}>
          {iconSrc && (
            <img src={iconSrc} alt="Icon preview"
              style={{ width: '56px', height: '56px', objectFit: 'contain', background: '#f3b33e', borderRadius: '50%', padding: '8px', flexShrink: 0 }} />
          )}
          <div>
            <input type="file" accept="image/svg+xml,image/png,image/webp,image/jpeg" className="adm-file" onChange={handleIconChange} />
            {iconSrc
              ? <p className="adm-hint">✓ Custom icon saved — will override the built-in SVG.</p>
              : <p className="adm-hint">No custom icon — the built-in SVG for key <strong>{theme.theme_key}</strong> is used.</p>
            }
          </div>
        </div>
      </div>

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}

// ── Tab: Quote ────────────────────────────────────────────────────────────────

function QuoteTab() {
  const [form, setForm] = useState({ quote_text:'', quote_attr:'', quote_mark_url:'', ornament_url:'' });
  const { save, saving, saved, error } = useSave(api.updateQuote);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/home/quote`)
      .then(r => r.json()).then(d => setForm(f => ({ ...f, ...d }))).catch(() => {});
  }, []);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Quote Section</h2>
      <Field label="Quote Text"         name="quote_text"     value={form.quote_text}     onChange={h} rows={4} />
      <Field label="Attribution"        name="quote_attr"     value={form.quote_attr}     onChange={h} />
      <Field label="Quote Mark Image URL" name="quote_mark_url" value={form.quote_mark_url} onChange={h} type="url" />
      <Field label="Ornament Image URL"   name="ornament_url"   value={form.ornament_url}   onChange={h} type="url" />
      <SaveBar onSave={() => save(form)} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Tab: Talks ────────────────────────────────────────────────────────────────

const EMPTY_TALK = { label: '', title: '', youtube_id: '', sort_order: 0 };

function TalksTab() {
  const [talks,          setTalks]         = useState([]);
  const [editId,         setEditId]        = useState(null);
  const [adding,         setAdding]        = useState(false);
  const [newT,           setNewT]          = useState(EMPTY_TALK);
  const [newThumbFile,   setNewThumbFile]  = useState(null);
  const [newThumbPreview, setNewThumbPreview] = useState(null);
  const SERVER = import.meta.env.VITE_SERVER_URL || 'https://vinaykulkarni.com';

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/home/talks`)
      .then(r => r.json()).then(setTalks).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveEdit    = async (t) => { await api.updateTalk(t.id, t); setEditId(null); load(); };
  const del         = async (id) => { if (!confirm('Delete talk?')) return; await api.deleteTalk(id); load(); };
  const saveNew     = async () => {
    const created = await api.addTalk(newT);
    if (newThumbFile && created?.id) await api.uploadTalkThumb(created.id, newThumbFile);
    setNewT(EMPTY_TALK);
    setNewThumbFile(null);
    setNewThumbPreview(null);
    setAdding(false);
    load();
  };
  const uploadThumb = async (id, file) => { const result = await api.uploadTalkThumb(id, file); load(); return result; };

  const handleNewThumb = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewThumbFile(file);
    setNewThumbPreview(URL.createObjectURL(file));
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Talks &amp; Videos</h2>
        <button className="adm-btn adm-btn-primary"
          onClick={() => { setAdding(a => !a); setNewThumbFile(null); setNewThumbPreview(null); }}>
          {adding ? 'Cancel' : '+ Add Talk'}
        </button>
      </div>
      <p className="adm-hint">Thumbnails fall back to the YouTube auto-thumbnail when no image is uploaded.</p>

      {adding && (
        <div className="adm-card-block">
          <h3 className="adm-sub-title">New Talk</h3>
          <TalkForm form={newT} setForm={setNewT} />
          <div className="adm-field">
            <label className="adm-label">Thumbnail (optional)</label>
            <div className="adm-photo-row" style={{ padding: '0.75rem' }}>
              {newThumbPreview && (
                <img src={newThumbPreview} alt="Thumbnail preview"
                  style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
              )}
              <div>
                <input type="file" accept="image/*" className="adm-file" onChange={handleNewThumb} />
                <p className="adm-hint">Leave empty to use the YouTube auto-thumbnail.</p>
              </div>
            </div>
          </div>
          <div className="adm-save-bar">
            <button className="adm-btn adm-btn-primary" onClick={saveNew}>Create</button>
            <button className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {talks.map(t => (
        <div key={t.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{t.label}</span>
            <span className="adm-card-title">{t.title}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === t.id ? null : t.id)}>{editId === t.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => del(t.id)}>Delete</button>
          </div>
          {editId === t.id && (
            <div className="adm-card-edit-form">
              <TalkEditBlock talk={t} onSave={saveEdit} onCancel={() => setEditId(null)} onThumbUpload={uploadThumb} serverBase={SERVER} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TalkForm({ form, setForm }) {
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <Row>
        <Field label="Label (e.g. Keynote)" name="label"      value={form.label}      onChange={h} />
        <Field label="YouTube Video ID"      name="youtube_id" value={form.youtube_id} onChange={h} hint="e.g. G3rH4FztvYQ" />
        <Field label="Sort Order"            name="sort_order" value={form.sort_order} onChange={h} type="number" />
      </Row>
      <Field label="Title" name="title" value={form.title} onChange={h} rows={2} />
    </>
  );
}

function TalkEditBlock({ talk, onSave, onCancel, onThumbUpload, serverBase }) {
  const [form, setForm] = useState({ ...talk });

  // Sync form.thumb_url when parent refreshes after upload, so Save doesn't overwrite it.
  useEffect(() => {
    setForm(f => ({ ...f, thumb_url: talk.thumb_url }));
  }, [talk.thumb_url]);

  const thumbSrc = form.thumb_url
    ? (form.thumb_url.startsWith('http') ? form.thumb_url : `${serverBase}${form.thumb_url}`)
    : `https://img.youtube.com/vi/${form.youtube_id}/hqdefault.jpg`;

  const handleThumbChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onThumbUpload(talk.id, file);
    if (result?.thumb_url) setForm(f => ({ ...f, thumb_url: result.thumb_url }));
  };

  return (
    <>
      <TalkForm form={form} setForm={setForm} />
      <div className="adm-field">
        <label className="adm-label">Thumbnail</label>
        <img src={thumbSrc} alt="" className="adm-talk-thumb-preview" />
        <input type="file" accept="image/*" className="adm-file" onChange={handleThumbChange} />
      </div>
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}

// ── Tab: Connect ──────────────────────────────────────────────────────────────

function ConnectTab() {
  const [desc,    setDesc]    = useState('');
  const [links,   setLinks]   = useState([]);
  const [newLink, setNewLink] = useState({ href:'', icon:'', label:'' });
  const [editId,  setEditId]  = useState(null);
  const { save, saving, saved, error } = useSave((data) => api.updateConnect({ description: data }));

  const load = useCallback(() =>
    fetch(`${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/home/connect`)
      .then(r => r.json()).then(d => { setDesc(d.description || ''); setLinks(d.links || []); }).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const addLink = async () => {
    if (!newLink.href) return;
    await api.addConnectLink({ ...newLink, sort_order: links.length + 1 });
    setNewLink({ href:'', icon:'', label:'' });
    load();
  };
  const delLink = async (id) => { if (!confirm('Remove link?')) return; await api.deleteConnectLink(id); load(); };
  const saveLink = async (link) => { await api.updateConnectLink(link.id, link); setEditId(null); load(); };

  return (
    <div className="adm-section">
      <h2 className="adm-section-title">Connect Section</h2>
      <Field label="Description" name="description" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
      <SaveBar onSave={() => save(desc)} saving={saving} saved={saved} error={error} />

      <hr className="adm-divider" />
      <h3 className="adm-sub-title">Social / External Links</h3>
      <p className="adm-hint">The "Book a Session" button is always shown and is not editable here.</p>

      {links.map(link => (
        <div key={link.id} className="adm-card-block">
          <div className="adm-card-header">
            <span className="adm-card-num">{link.icon}</span>
            <span className="adm-card-title">{link.label}</span>
            <span className="adm-hint" style={{ flex:1 }}>{link.href}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => setEditId(editId === link.id ? null : link.id)}>{editId === link.id ? 'Cancel' : 'Edit'}</button>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => delLink(link.id)}>Remove</button>
          </div>
          {editId === link.id && <ConnectLinkEditBlock link={link} onSave={saveLink} onCancel={() => setEditId(null)} />}
        </div>
      ))}

      <div className="adm-card-block" style={{ marginTop: '0.75rem' }}>
        <h3 className="adm-sub-title">Add New Link</h3>
        <Row>
          <Field label="Icon (e.g. in, 𝕏, ✉)" name="icon"  value={newLink.icon}  onChange={e => setNewLink(l => ({ ...l, icon:  e.target.value }))} />
          <Field label="Label"                  name="label" value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} />
        </Row>
        <Field label="URL" name="href" value={newLink.href} onChange={e => setNewLink(l => ({ ...l, href: e.target.value }))} type="url" />
        <div className="adm-save-bar">
          <button className="adm-btn adm-btn-primary" onClick={addLink}>Add Link</button>
        </div>
      </div>
    </div>
  );
}

function ConnectLinkEditBlock({ link, onSave, onCancel }) {
  const [form, setForm] = useState({ ...link });
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="adm-card-edit-form">
      <Row>
        <Field label="Icon" name="icon"  value={form.icon}  onChange={h} />
        <Field label="Label" name="label" value={form.label} onChange={h} />
      </Row>
      <Field label="URL" name="href" value={form.href} onChange={h} type="url" />
      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={() => onSave(form)}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main HomeAdmin ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',     label: 'Hero',             Component: HeroTab     },
  { id: 'marquee',  label: 'Marquee',          Component: MarqueeTab  },
  { id: 'about',    label: 'About',            Component: AboutTab    },
  { id: 'articles', label: 'Articles',         Component: ArticlesTab },
  { id: 'themes',   label: 'Themes',           Component: ThemesTab   },
  { id: 'quote',    label: 'Quote',            Component: QuoteTab    },
  { id: 'talks',    label: 'Talks',            Component: TalksTab    },
  { id: 'connect',  label: 'Connect',          Component: ConnectTab  },
  { id: 'extra',    label: 'Extra Sections',   Component: () => <SiteBlocksTab pageSlug="home" /> },
  { id: 'order',    label: 'Section Order',      Component: () => <SectionOrderTab pageSlug="home" /> },
  { id: 'seo',      label: 'SEO',                Component: () => <SeoTab pageSlug="home" /> },
];

function HomeAdmin() {
  const [active, setActive] = useState('hero');
  const ActiveTab = TABS.find(t => t.id === active)?.Component;

  return (
    <div className="bio-adm-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Page CMS</span>
          <h1 className="bio-adm-title">Home</h1>
        </div>
        <div className="bio-adm-header-actions">
          <PublishToggle slug="home" />
          <a href="/" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Page</a>
        </div>
      </div>

      <div className="bio-adm-tabs" role="tablist">
        {TABS.map(t => (
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
        {ActiveTab && <ActiveTab />}
      </div>
    </div>
  );
}

export default HomeAdmin;
