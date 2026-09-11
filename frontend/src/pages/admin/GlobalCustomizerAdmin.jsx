import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../services/customizerApi';
import { applyCustomizerSettings } from '../../hooks/useGlobalCustomizer';
import './GlobalCustomizerAdmin.css';

// ── Google Fonts list ─────────────────────────────────────────────────────────

const GOOGLE_FONTS = [
  'Cormorant Garamond',
  'Josefin Sans',
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Merriweather',
  'Playfair Display',
  'Source Sans 3',
  'Nunito',
  'Raleway',
  'Ubuntu',
  'Work Sans',
  'DM Sans',
  'Noto Sans',
  'EB Garamond',
  'Libre Baskerville',
  'Crimson Text',
  'Noto Serif',
  'PT Serif',
  'PT Sans',
  'Mulish',
  'Quicksand',
  'Karla',
  'Rubik',
  'Oswald',
  'Cabin',
  'Titillium Web',
];

// ── FontSelect — searchable dropdown ─────────────────────────────────────────

function FontSelect({ value, onChange }) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const ref = useRef(null);

  const filtered = query.trim()
    ? GOOGLE_FONTS.filter(f => f.toLowerCase().includes(query.toLowerCase()))
    : GOOGLE_FONTS;

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (font) => {
    onChange(font);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="gc-font-select" ref={ref}>
      <div className="gc-font-select-trigger" onClick={() => setOpen(o => !o)}>
        <span className="gc-font-select-value" style={{ fontFamily: `'${value}', sans-serif` }}>
          {value || 'Select a font…'}
        </span>
        <span className="gc-font-select-arrow">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="gc-font-select-dropdown">
          <input
            className="gc-font-select-search"
            placeholder="Search fonts…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="gc-font-select-list">
            {filtered.length === 0 && (
              <li className="gc-font-select-empty">No fonts found</li>
            )}
            {filtered.map(font => (
              <li
                key={font}
                className={`gc-font-select-item${font === value ? ' selected' : ''}`}
                onClick={() => select(font)}
                style={{ fontFamily: `'${font}', sans-serif` }}
              >
                {font}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FONT_PRESETS = [
  { label: 'Classic',    heading: 'Cormorant Garamond', body: 'Josefin Sans' },
  { label: 'Elegant',    heading: 'Playfair Display',   body: 'Raleway' },
  { label: 'Editorial',  heading: 'Merriweather',       body: 'Lato' },
  { label: 'Academic',   heading: 'EB Garamond',        body: 'Montserrat' },
  { label: 'Traditional',heading: 'Libre Baskerville',  body: 'Source Sans Pro' },
  { label: 'Literary',   heading: 'Crimson Text',       body: 'Open Sans' },
];

const COLOR_PALETTES = [
  {
    label: 'Warm Earth',
    swatches: ['#d4670a','#b8922a','#1a1208','#8a7d6b','#faf6ee','#f5edd8','#8b1a1a','rgba(184,146,42,0.25)'],
    settings: { accent:'#d4670a', links:'#d4670a', headings:'#1a1208', bodyText:'#1a1208', borders:'rgba(184,146,42,0.25)', siteBackground:'#faf6ee', contentBackground:'#f5edd8' },
  },
  {
    label: 'Ocean Blue',
    swatches: ['#2563eb','#1d4ed8','#1e3a5f','#475569','#f0f4ff','#e8edf8','#0c4a6e','rgba(37,99,235,0.2)'],
    settings: { accent:'#2563eb', links:'#2563eb', headings:'#1e3a5f', bodyText:'#1e293b', borders:'rgba(37,99,235,0.2)', siteBackground:'#f0f4ff', contentBackground:'#e8edf8' },
  },
  {
    label: 'Forest',
    swatches: ['#16803a','#15803d','#14532d','#4b7c5e','#f0fdf4','#dcfce7','#052e16','rgba(22,128,58,0.2)'],
    settings: { accent:'#16803a', links:'#16803a', headings:'#14532d', bodyText:'#1c3826', borders:'rgba(22,128,58,0.2)', siteBackground:'#f0fdf4', contentBackground:'#dcfce7' },
  },
];

const BUTTON_PRESETS = [
  { textColor:'#fff',    bgColor:'#1a1208',     borderColor:'transparent',  borderRadiusTop:'2',   borderRadiusRight:'2',   borderRadiusBottom:'2',   borderRadiusLeft:'2'  },
  { textColor:'#fff',    bgColor:'#3d3529',     borderColor:'transparent',  borderRadiusTop:'6',   borderRadiusRight:'6',   borderRadiusBottom:'6',   borderRadiusLeft:'6'  },
  { textColor:'#fff',    bgColor:'#5a4e3a',     borderColor:'transparent',  borderRadiusTop:'999', borderRadiusRight:'999', borderRadiusBottom:'999', borderRadiusLeft:'999'},
  { textColor:'#1a1208', bgColor:'transparent', borderColor:'#1a1208',      borderRadiusTop:'2',   borderRadiusRight:'2',   borderRadiusBottom:'2',   borderRadiusLeft:'2'  },
  { textColor:'#3d3529', bgColor:'transparent', borderColor:'#3d3529',      borderRadiusTop:'6',   borderRadiusRight:'6',   borderRadiusBottom:'6',   borderRadiusLeft:'6'  },
  { textColor:'#5a4e3a', bgColor:'transparent', borderColor:'#5a4e3a',      borderRadiusTop:'999', borderRadiusRight:'999', borderRadiusBottom:'999', borderRadiusLeft:'999'},
];

const CONTAINER_LAYOUTS = [
  { value: 'standard', label: 'Standard', icon: (
    <svg viewBox="0 0 80 56" fill="none"><rect x="4" y="4" width="72" height="48" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/><rect x="12" y="12" width="56" height="8" rx="1" fill="currentColor" opacity="0.35"/><rect x="12" y="24" width="56" height="4" rx="1" fill="currentColor" opacity="0.2"/><rect x="12" y="32" width="40" height="4" rx="1" fill="currentColor" opacity="0.2"/></svg>
  )},
  { value: 'wide', label: 'Wide', icon: (
    <svg viewBox="0 0 80 56" fill="none"><rect x="1" y="4" width="78" height="48" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="12" width="72" height="8" rx="1" fill="currentColor" opacity="0.35"/><rect x="4" y="24" width="72" height="4" rx="1" fill="currentColor" opacity="0.2"/><rect x="4" y="32" width="50" height="4" rx="1" fill="currentColor" opacity="0.2"/></svg>
  )},
  { value: 'narrow', label: 'Narrow', icon: (
    <svg viewBox="0 0 80 56" fill="none"><rect x="16" y="4" width="48" height="48" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/><rect x="22" y="12" width="36" height="8" rx="1" fill="currentColor" opacity="0.35"/><rect x="22" y="24" width="36" height="4" rx="1" fill="currentColor" opacity="0.2"/><rect x="22" y="32" width="24" height="4" rx="1" fill="currentColor" opacity="0.2"/></svg>
  )},
];

const H_LEVELS = ['h1','h2','h3','h4','h5','h6'];
const SIZES_DEFAULT = { h1:'3.5',h2:'2.5',h3:'2.0',h4:'1.5',h5:'1.25',h6:'1.0' };

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEF_TYPOGRAPHY  = { bodyFont:'Cormorant Garamond', headingFont:'Josefin Sans', h1Size:'3.5', h1Unit:'rem', h2Size:'2.5', h2Unit:'rem', h3Size:'2.0', h3Unit:'rem', h4Size:'1.5', h4Unit:'rem', h5Size:'1.25', h5Unit:'rem', h6Size:'1.0', h6Unit:'rem', paragraphMarginBottom:'1', paragraphMarginUnit:'em' };
const DEF_COLORS      = { accent:'#d4670a', links:'#d4670a', headings:'#1a1208', bodyText:'#1a1208', borders:'rgba(184,146,42,0.25)', siteBackground:'#faf6ee', contentBackground:'#f5edd8' };
const DEF_CONTAINER   = { layout:'standard', style:'unboxed', containerWidth:1200, narrowWidth:750 };
const DEF_BUTTONS     = { textColor:'#ffffff', bgColor:'#d4670a', borderColor:'transparent', font:'Josefin Sans', paddingTop:'12', paddingRight:'28', paddingBottom:'12', paddingLeft:'28', paddingUnit:'px', borderWidthTop:'0', borderWidthRight:'0', borderWidthBottom:'0', borderWidthLeft:'0', borderRadiusTop:'3', borderRadiusRight:'3', borderRadiusBottom:'3', borderRadiusLeft:'3', borderRadiusUnit:'px' };
const DEF_PROTECTION  = { frontendProtection: false, adminProtection: false };

// ── Shared tiny components ────────────────────────────────────────────────────

function SectionDivider({ label }) {
  return <div className="gc-divider"><span>{label}</span></div>;
}

function ColorSwatch({ value, onChange, label, onReset }) {
  const displayVal = (value && value !== 'transparent' && !value.startsWith('rgba')) ? value : '#ffffff';
  return (
    <div className="gc-color-row">
      <span className="gc-color-label">{label}</span>
      <div className="gc-color-controls">
        {onReset && <button className="gc-icon-btn" onClick={onReset} title="Reset to default">↺</button>}
        <label className="gc-swatch-wrap" title={value}>
          <span className="gc-swatch" style={{ background: value || '#ccc' }} />
          <input type="color" value={displayVal} onChange={e => onChange(e.target.value)} className="gc-color-hidden" />
        </label>
      </div>
    </div>
  );
}

function SaveBar({ onSave, saving, saved }) {
  return (
    <div className="gc-save-bar">
      <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved && <span className="gc-saved-msg">✓ Applied to site</span>}
    </div>
  );
}

// ── TYPOGRAPHY TAB ─────────────────────────────────────────────────────────────

function TypographyTab() {
  const [form,   setForm]   = useState(DEF_TYPOGRAPHY);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('typography').then(d => setForm({ ...DEF_TYPOGRAPHY, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const applyPreset = (p) => setForm(f => ({ ...f, bodyFont: p.body, headingFont: p.heading }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('typography', form);
      applyCustomizerSettings({ typography: form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">
      {/* Font Presets */}
      <div className="gc-section">
        <div className="gc-section-head">
          <span className="gc-section-label">Presets</span>
          <button className="gc-icon-btn" onClick={() => setForm(DEF_TYPOGRAPHY)} title="Reset all">↺</button>
        </div>
        <div className="gc-font-presets">
          {FONT_PRESETS.map(p => (
            <button
              key={p.label}
              className={`gc-font-preset${form.headingFont === p.heading && form.bodyFont === p.body ? ' active' : ''}`}
              onClick={() => applyPreset(p)}
            >
              <span className="gc-preset-heading" style={{ fontFamily: `'${p.heading}', serif` }}>Heading</span>
              <span className="gc-preset-body" style={{ fontFamily: `'${p.body}', sans-serif` }}>{p.body}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Base Font */}
      <SectionDivider label="Base Font" />
      <div className="gc-section">
        {[['Body Font','bodyFont'],['Headings Font','headingFont']].map(([lbl, key]) => (
          <div key={key} className="gc-font-row">
            <span className="gc-font-row-label">{lbl}</span>
            <FontSelect value={form[key] || ''} onChange={v => set(key, v)} />
            <span className="gc-font-preview" style={{ fontFamily: `'${form[key]}', sans-serif` }}>Aa</span>
          </div>
        ))}
      </div>

      {/* Heading Sizes */}
      <SectionDivider label="Heading Font Sizes" />
      <div className="gc-section">
        {H_LEVELS.map(h => (
          <div key={h} className="gc-font-row">
            <span className="gc-font-row-label" style={{ textTransform:'uppercase', fontSize:'0.7rem', fontWeight:700 }}>{h} Size</span>
            <div className="gc-size-row">
              <input
                type="number"
                className="gc-size-inp"
                value={form[`${h}Size`] ?? SIZES_DEFAULT[h]}
                min="0.5" step="0.1"
                onChange={e => set(`${h}Size`, e.target.value)}
              />
              <select className="gc-unit-sel" value={form[`${h}Unit`] || 'rem'} onChange={e => set(`${h}Unit`, e.target.value)}>
                <option value="rem">rem</option>
                <option value="em">em</option>
                <option value="px">px</option>
                <option value="vw">vw</option>
              </select>
            </div>
            <span className="gc-font-preview" style={{ fontFamily: `'${form.headingFont}', sans-serif`, fontSize: `${Math.min(+form[`${h}Size`] || 1, 2.5) * 8}px` }}>Aa</span>
          </div>
        ))}
      </div>

      {/* Paragraph Margin */}
      <SectionDivider label="Paragraph Spacing" />
      <div className="gc-section">
        <div className="gc-slider-group">
          <div className="gc-slider-head">
            <span className="gc-slider-label">Paragraph Margin Bottom</span>
            <div className="gc-unit-tabs">
              {['em','rem','px'].map(u => (
                <button key={u} className={`gc-unit-tab${form.paragraphMarginUnit === u ? ' active' : ''}`}
                  onClick={() => set('paragraphMarginUnit', u)}>{u.toUpperCase()}</button>
              ))}
              <button className="gc-icon-btn" onClick={() => { set('paragraphMarginBottom','1'); set('paragraphMarginUnit','em'); }} title="Reset">↺</button>
            </div>
          </div>
          <div className="gc-slider-row">
            <input type="range" min="0" max="4" step="0.1"
              value={+form.paragraphMarginBottom || 1}
              onChange={e => set('paragraphMarginBottom', e.target.value)}
              className="gc-slider"
            />
            <input type="number" min="0" step="0.1"
              value={form.paragraphMarginBottom || '1'}
              onChange={e => set('paragraphMarginBottom', e.target.value)}
              className="gc-number-inp"
            />
          </div>
        </div>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── COLORS TAB ────────────────────────────────────────────────────────────────

function ColorsTab() {
  const [form,   setForm]   = useState(DEF_COLORS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('colors').then(d => setForm({ ...DEF_COLORS, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const applyPalette = (p) => setForm(f => ({ ...f, ...p.settings }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('colors', form);
      applyCustomizerSettings({ colors: form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">
      {/* Global Palette Presets */}
      <div className="gc-section">
        <div className="gc-section-head">
          <span className="gc-section-label">Global Palette</span>
          <button className="gc-icon-btn" onClick={() => setForm(DEF_COLORS)} title="Reset">↺</button>
        </div>
        <div className="gc-palette-presets">
          {COLOR_PALETTES.map(p => (
            <button
              key={p.label}
              className="gc-palette-card"
              onClick={() => applyPalette(p)}
              title={`Apply ${p.label} palette`}
            >
              <div className="gc-palette-swatches">
                {p.swatches.slice(0,5).map((s, i) => (
                  <div key={i} className="gc-palette-swatch-block" style={{ background: s }} />
                ))}
              </div>
              <span className="gc-palette-label">{p.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
        {/* Current palette dot row */}
        <div className="gc-palette-dots">
          {[form.accent, form.links, form.headings, form.bodyText, '#ffffff', form.siteBackground, form.contentBackground, form.borders].map((c, i) => (
            <span key={i} className="gc-palette-dot" style={{ background: c, border: c === '#ffffff' ? '1px solid #e0d8cc' : undefined }} />
          ))}
        </div>
      </div>

      {/* Theme Colors */}
      <SectionDivider label="Theme Color" />
      <div className="gc-section">
        <ColorSwatch label="Accent"          value={form.accent}    onChange={v => set('accent', v)}    onReset={() => set('accent', DEF_COLORS.accent)} />
        <ColorSwatch label="Links"           value={form.links}     onChange={v => set('links', v)}     onReset={() => set('links', DEF_COLORS.links)} />
        <ColorSwatch label="Heading (H1–H6)" value={form.headings}  onChange={v => set('headings', v)}  onReset={() => set('headings', DEF_COLORS.headings)} />
        <ColorSwatch label="Body Text"       value={form.bodyText}  onChange={v => set('bodyText', v)}  onReset={() => set('bodyText', DEF_COLORS.bodyText)} />
        <ColorSwatch label="Borders"         value={form.borders}   onChange={v => set('borders', v)}   onReset={() => set('borders', DEF_COLORS.borders)} />
      </div>

      {/* Surface Colors */}
      <SectionDivider label="Surface Color" />
      <div className="gc-section">
        <ColorSwatch label="Site Background"    value={form.siteBackground}    onChange={v => set('siteBackground', v)}    onReset={() => set('siteBackground', DEF_COLORS.siteBackground)} />
        <ColorSwatch label="Content Background" value={form.contentBackground} onChange={v => set('contentBackground', v)} onReset={() => set('contentBackground', DEF_COLORS.contentBackground)} />
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── CONTAINER TAB ─────────────────────────────────────────────────────────────

function ContainerTab() {
  const [form,   setForm]   = useState(DEF_CONTAINER);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('container').then(d => setForm({ ...DEF_CONTAINER, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('container', form);
      applyCustomizerSettings({ container: form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">
      {/* Container Layout */}
      <div className="gc-section">
        <span className="gc-section-label">Container Layout</span>
        <div className="gc-layout-opts">
          {CONTAINER_LAYOUTS.map(l => (
            <button
              key={l.value}
              className={`gc-layout-opt${form.layout === l.value ? ' active' : ''}`}
              onClick={() => set('layout', l.value)}
            >
              {l.icon}
              <span className="gc-layout-opt-label">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Container Style */}
      <SectionDivider label="Container Style" />
      <div className="gc-section">
        <div className="gc-toggle-row">
          <button className={`gc-toggle-btn${form.style === 'unboxed' ? ' active' : ''}`} onClick={() => set('style','unboxed')}>Unboxed</button>
          <button className={`gc-toggle-btn${form.style === 'boxed'   ? ' active' : ''}`} onClick={() => set('style','boxed')}>Boxed</button>
        </div>
        <p className="gc-hint">
          {form.style === 'boxed' ? 'Page content is centered in a max-width box with a subtle shadow.' : 'Content spans the full viewport width with no outer boundary.'}
        </p>
      </div>

      {/* Container Width */}
      <SectionDivider label="Container Width" />
      <div className="gc-section">
        <div className="gc-slider-group">
          <div className="gc-slider-head">
            <span className="gc-slider-label">Container Width</span>
            <div className="gc-unit-tabs">
              <span className="gc-unit-tab active">PX</span>
              <button className="gc-icon-btn" onClick={() => set('containerWidth', 1200)} title="Reset">↺</button>
            </div>
          </div>
          <div className="gc-slider-row">
            <input type="range" min="600" max="1800" step="10"
              value={form.containerWidth || 1200}
              onChange={e => set('containerWidth', +e.target.value)}
              className="gc-slider"
            />
            <input type="number" min="600" max="1800"
              value={form.containerWidth || 1200}
              onChange={e => set('containerWidth', +e.target.value)}
              className="gc-number-inp"
            />
          </div>
        </div>

        <div className="gc-slider-group" style={{ marginTop: '1.25rem' }}>
          <div className="gc-slider-head">
            <span className="gc-slider-label">Narrow Container Width</span>
            <div className="gc-unit-tabs">
              <span className="gc-unit-tab active">PX</span>
              <button className="gc-icon-btn" onClick={() => set('narrowWidth', 750)} title="Reset">↺</button>
            </div>
          </div>
          <div className="gc-slider-row">
            <input type="range" min="400" max="1200" step="10"
              value={form.narrowWidth || 750}
              onChange={e => set('narrowWidth', +e.target.value)}
              className="gc-slider"
            />
            <input type="number" min="400" max="1200"
              value={form.narrowWidth || 750}
              onChange={e => set('narrowWidth', +e.target.value)}
              className="gc-number-inp"
            />
          </div>
        </div>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── BUTTONS TAB ───────────────────────────────────────────────────────────────

function FourFields({ label, keys, form, setForm, unit, unitKey, unitOptions }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const linked = keys.every(k => form[k] === form[keys[0]]);
  const [lock, setLock] = useState(linked);

  const update = (k, v) => {
    if (lock) {
      const upd = {};
      keys.forEach(key => { upd[key] = v; });
      setForm(f => ({ ...f, ...upd }));
    } else {
      set(k, v);
    }
  };

  const subLabels = ['TOP','RIGHT','BOTTOM','LEFT'];
  return (
    <div className="gc-4fields-group">
      <div className="gc-4fields-head">
        <span className="gc-slider-label">{label}</span>
        <div className="gc-unit-tabs">
          {unitOptions?.map(u => (
            <button key={u} className={`gc-unit-tab${(form[unitKey]||unitOptions[0])===u?' active':''}`}
              onClick={() => set(unitKey, u)}>{u.toUpperCase()}</button>
          ))}
        </div>
      </div>
      <div className="gc-4fields-row">
        {keys.map((k, i) => (
          <div key={k} className="gc-4field-cell">
            <input type="number" className="gc-4field-inp"
              value={form[k] || '0'}
              onChange={e => update(k, e.target.value)} />
            <span className="gc-4field-label">{subLabels[i]}</span>
          </div>
        ))}
        <button
          className={`gc-link-btn${lock ? ' active' : ''}`}
          onClick={() => setLock(l => !l)}
          title={lock ? 'Unlink values' : 'Link all values'}
        >
          {lock ? '⛓' : '⛓︎'}
        </button>
      </div>
    </div>
  );
}

function ButtonsTab() {
  const [form,   setForm]   = useState(DEF_BUTTONS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('buttons').then(d => setForm({ ...DEF_BUTTONS, ...d })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const applyPreset = (p) => setForm(f => ({ ...f, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('buttons', form);
      applyCustomizerSettings({ buttons: form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  // Live preview button style
  const previewStyle = {
    color: form.textColor,
    background: form.bgColor,
    border: `${form.borderWidthTop||0}px ${form.borderWidthRight||0}px ${form.borderWidthBottom||0}px ${form.borderWidthLeft||0}px solid ${form.borderColor}`,
    borderStyle: 'solid',
    padding: `${form.paddingTop||12}${form.paddingUnit||'px'} ${form.paddingRight||28}${form.paddingUnit||'px'} ${form.paddingBottom||12}${form.paddingUnit||'px'} ${form.paddingLeft||28}${form.paddingUnit||'px'}`,
    borderRadius: `${form.borderRadiusTop||3}${form.borderRadiusUnit||'px'} ${form.borderRadiusRight||3}${form.borderRadiusUnit||'px'} ${form.borderRadiusBottom||3}${form.borderRadiusUnit||'px'} ${form.borderRadiusLeft||3}${form.borderRadiusUnit||'px'}`,
    fontFamily: form.font ? `'${form.font}', sans-serif` : undefined,
    cursor: 'default',
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  const displayColor = (v) => (v && v !== 'transparent' && !v.startsWith('rgba')) ? v : '#cccccc';

  return (
    <div className="gc-tab-body">
      {/* Presets */}
      <div className="gc-section">
        <div className="gc-section-head">
          <span className="gc-section-label">Button Presets</span>
          <button className="gc-icon-btn" onClick={() => setForm(DEF_BUTTONS)} title="Reset">↺</button>
        </div>
        <div className="gc-btn-presets">
          {BUTTON_PRESETS.map((p, i) => (
            <button key={i}
              className="gc-btn-preset"
              onClick={() => applyPreset(p)}
              style={{
                color: p.textColor,
                background: p.bgColor === 'transparent' ? 'transparent' : p.bgColor,
                border: `1.5px solid ${p.borderColor === 'transparent' ? p.textColor : p.borderColor}`,
                borderRadius: `${p.borderRadiusTop}px`,
              }}
            >
              Button
            </button>
          ))}
        </div>
        {/* Live preview */}
        <div className="gc-btn-preview-wrap">
          <span className="gc-hint-label">Preview</span>
          <button style={previewStyle}>Button</button>
        </div>
      </div>

      {/* Colors */}
      <SectionDivider label="Colors" />
      <div className="gc-section">
        <div className="gc-color-row">
          <span className="gc-color-label">Text Color</span>
          <div className="gc-color-controls">
            <button className="gc-icon-btn" onClick={() => set('textColor', DEF_BUTTONS.textColor)} title="Reset">↺</button>
            <label className="gc-swatch-wrap">
              <span className="gc-swatch" style={{ background: form.textColor }} />
              <input type="color" value={displayColor(form.textColor)} onChange={e => set('textColor', e.target.value)} className="gc-color-hidden" />
            </label>
          </div>
        </div>
        <div className="gc-color-row">
          <span className="gc-color-label">Background Color</span>
          <div className="gc-color-controls">
            <button className="gc-icon-btn" onClick={() => set('bgColor', DEF_BUTTONS.bgColor)} title="Reset">↺</button>
            <label className="gc-swatch-wrap">
              <span className="gc-swatch" style={{ background: form.bgColor }} />
              <input type="color" value={displayColor(form.bgColor)} onChange={e => set('bgColor', e.target.value)} className="gc-color-hidden" />
            </label>
          </div>
        </div>
        <div className="gc-color-row">
          <span className="gc-color-label">Border Color</span>
          <div className="gc-color-controls">
            <button className="gc-icon-btn" onClick={() => set('borderColor', DEF_BUTTONS.borderColor)} title="Reset">↺</button>
            <label className="gc-swatch-wrap">
              <span className="gc-swatch" style={{ background: form.borderColor === 'transparent' ? '#eee' : form.borderColor, border: form.borderColor === 'transparent' ? '1px dashed #ccc' : undefined }} />
              <input type="color" value={displayColor(form.borderColor)} onChange={e => set('borderColor', e.target.value)} className="gc-color-hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Font */}
      <SectionDivider label="Font" />
      <div className="gc-section">
        <div className="gc-font-row">
          <span className="gc-font-row-label">Button Font</span>
          <input className="gc-font-inp" value={form.font || ''} onChange={e => set('font', e.target.value)} placeholder="e.g. Josefin Sans" />
          <span className="gc-font-preview" style={{ fontFamily: `'${form.font}', sans-serif` }}>Aa</span>
        </div>
      </div>

      {/* Padding */}
      <SectionDivider label="Padding" />
      <div className="gc-section">
        <FourFields
          label="Padding"
          keys={['paddingTop','paddingRight','paddingBottom','paddingLeft']}
          form={form}
          setForm={setForm}
          unitKey="paddingUnit"
          unitOptions={['px','em','%']}
        />
      </div>

      {/* Border Width */}
      <SectionDivider label="Border Width" />
      <div className="gc-section">
        <FourFields
          label="Border Width"
          keys={['borderWidthTop','borderWidthRight','borderWidthBottom','borderWidthLeft']}
          form={form}
          setForm={setForm}
          unitKey={null}
          unitOptions={null}
        />
      </div>

      {/* Border Radius */}
      <SectionDivider label="Border Radius" />
      <div className="gc-section">
        <FourFields
          label="Border Radius"
          keys={['borderRadiusTop','borderRadiusRight','borderRadiusBottom','borderRadiusLeft']}
          form={form}
          setForm={setForm}
          unitKey="borderRadiusUnit"
          unitOptions={['px','em','%']}
        />
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── SECURITY TAB ──────────────────────────────────────────────────────────────

function ProtectionBlock({ label, fieldKey, form, setForm, hint }) {
  const enabled = !!form[fieldKey];
  return (
    <div className="gc-section">
      <div className="gc-section-head">
        <span className="gc-section-label">{label}</span>
      </div>

      <div className="gc-protection-status" data-active={String(enabled)}>
        <span className="gc-protection-dot" />
        <span className="gc-protection-status-text">
          {enabled ? 'Active' : 'Disabled'}
        </span>
      </div>

      <div className="gc-toggle-row" style={{ marginTop: '0.75rem' }}>
        <button
          className={`gc-toggle-btn${enabled ? ' active' : ''}`}
          onClick={() => setForm(f => ({ ...f, [fieldKey]: true }))}
        >
          Enable
        </button>
        <button
          className={`gc-toggle-btn${!enabled ? ' active' : ''}`}
          onClick={() => setForm(f => ({ ...f, [fieldKey]: false }))}
        >
          Disable
        </button>
      </div>

      <p className="gc-hint" style={{ marginTop: '0.75rem' }}>{hint}</p>
    </div>
  );
}

function SecurityTab() {
  const [form,   setForm]   = useState(DEF_PROTECTION);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('site-protection')
      .then(d => setForm({ ...DEF_PROTECTION, ...d }))
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('site-protection', form);
      applyCustomizerSettings({ 'site-protection': form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">

      <ProtectionBlock
        label="Frontend Protection"
        fieldKey="frontendProtection"
        form={form}
        setForm={setForm}
        hint="Applies to all public-facing pages only. Disables text selection, blocks right-click and copy shortcuts (Ctrl/Cmd + C, X, S, P, A), and shows a black overlay on Print Screen or window blur. The Admin panel is never affected by this toggle."
      />

      <SectionDivider label="Admin Panel Protection" />

      <ProtectionBlock
        label="Admin Protection"
        fieldKey="adminProtection"
        form={form}
        setForm={setForm}
        hint="Applies only within the Admin CMS. Disables text selection, blocks right-click and copy shortcuts, and shows a black overlay on Print Screen or window blur inside the admin interface. The public-facing website is never affected by this toggle."
      />

      <div className="gc-section" style={{ borderTop: '1px solid #f0ece4', paddingTop: '1rem' }}>
        <p className="gc-hint" style={{ margin: 0 }}>
          Both toggles are fully independent. Each stores its state separately and
          applies protection only to its own context. No browser-based method can
          block all screen-capture tools.
        </p>
      </div>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Global CSS Tab ────────────────────────────────────────────────────────────

const DEF_GLOBAL_CSS = { css: '' };

function GlobalCSSTab() {
  const [form,   setForm]   = useState(DEF_GLOBAL_CSS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getCustomizerSection('global-css')
      .then(d => setForm({ ...DEF_GLOBAL_CSS, ...d }))
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.saveCustomizerSection('global-css', form);
      applyCustomizerSettings({ 'global-css': form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="gc-tab-body">
      <div className="gc-section">
        <span className="gc-section-label">Custom CSS</span>
        <p className="gc-hint">
          Write or paste CSS here. This stylesheet is injected last — after all other styles — so
          it overrides anything on the site. Changes are applied globally and immediately upon saving.
        </p>
        <textarea
          className="gc-css-editor"
          spellCheck={false}
          value={form.css}
          onChange={e => setForm(f => ({ ...f, css: e.target.value }))}
          placeholder={`/* Example */\n.hero-title {\n  letter-spacing: 0.05em;\n}`}
        />
        {form.css.trim() && (
          <p className="gc-hint gc-hint--warn">
            Custom CSS runs with full specificity. Test carefully — invalid rules may break the layout.
          </p>
        )}
      </div>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'typography', label: 'Typography' },
  { id: 'colors',     label: 'Colors' },
  { id: 'container',  label: 'Container' },
  { id: 'buttons',    label: 'Buttons' },
  { id: 'security',   label: 'Security' },
  { id: 'global-css', label: 'Global CSS' },
];

function GlobalCustomizerAdmin() {
  const [active, setActive] = useState('typography');

  return (
    <div className="bio-adm-root gc-root">
      <div className="bio-adm-header">
        <div>
          <span className="bio-adm-eyebrow">Global Settings</span>
          <h1 className="bio-adm-title">Customizer</h1>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="bio-adm-view-link">↗ View Site</a>
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

      <div className="gc-content">
        {active === 'typography' && <TypographyTab />}
        {active === 'colors'     && <ColorsTab />}
        {active === 'container'  && <ContainerTab />}
        {active === 'buttons'    && <ButtonsTab />}
        {active === 'security'   && <SecurityTab />}
        {active === 'global-css' && <GlobalCSSTab />}
      </div>
    </div>
  );
}

export default GlobalCustomizerAdmin;
