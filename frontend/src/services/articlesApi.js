const API_ROOT = import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api';
const BASE = `${API_ROOT}/articles`;

export function resolveUploadUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return API_ROOT.replace(/\/api$/, '') + url;
}

function authHeaders() {
  const token = localStorage.getItem('vk_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Public ────────────────────────────────────────────────────────────────────
export const getArticles    = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `${BASE}${qs ? '?' + qs : ''}`);
};

export const getCategories  = ()     => req('GET', `${BASE}/categories`);
export const getArticle     = (slug) => req('GET', `${BASE}/${slug}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAllArticles  = ()          => req('GET',    `${BASE}/admin/all`);
export const createArticle  = (body)      => req('POST',   BASE, body);
export const updateArticle  = (id, body)  => req('PUT',    `${BASE}/${id}`, body);
export const deleteArticle  = (id)        => req('DELETE', `${BASE}/${id}`);
export const reorderArticles= (items)     => req('PUT',    `${BASE}/reorder`, { items });
export const getArticleById = (id)        => req('GET',    `${BASE}/by-id/${id}`);

export const getAllCategories  = ()          => req('GET',    `${BASE}/categories/all`);
export const createCategory    = (body)      => req('POST',   `${BASE}/categories`, body);
export const updateCategory    = (id, body)  => req('PUT',    `${BASE}/categories/${id}`, body);
export const deleteCategory    = (id)        => req('DELETE', `${BASE}/categories/${id}`);

// Returns the absolute URL for inline images uploaded via CKEditor
export function getInlineImageUploadUrl() {
  return `${BASE}/upload-image`;
}

// ── Likes (localStorage + optional server count) ──────────────────────────────
const LS_KEY = 'vk_liked_articles';

function localLiked() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]').map(Number)); }
  catch { return new Set(); }
}
function saveLocalLiked(set) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

// Session flag: once the /likes endpoint returns 404 we stop polling it
let _likesSupported = null; // null = unknown, true = yes, false = no

async function fetchServerCounts(ids) {
  if (_likesSupported === false) return {};
  try {
    const qs = new URLSearchParams({ ids: ids.join(',') }).toString();
    const r  = await fetch(`${BASE}/likes?${qs}`);
    if (r.status === 404) { _likesSupported = false; return {}; }
    if (!r.ok) return {};
    _likesSupported = true;
    const d = await r.json();
    return d.counts || {};
  } catch { return {}; }
}

export async function getLikes(articleId) {
  const liked  = localLiked().has(Number(articleId));
  const counts = await fetchServerCounts([articleId]);
  return { liked, count: counts[articleId] || 0 };
}

export async function getLikesBatch(ids) {
  const liked  = [...localLiked()].filter(id => ids.map(Number).includes(id));
  const counts = await fetchServerCounts(ids);
  return { liked, counts };
}

export function likeArticle(articleId) {
  const id  = Number(articleId);
  const set = localLiked();
  set.has(id) ? set.delete(id) : set.add(id);
  saveLocalLiked(set);
  return Promise.resolve({ liked: set.has(id) });
}

// ── Comments ──────────────────────────────────────────────────────────────────
export async function getComments(articleId) {
  try {
    const r = await fetch(`${BASE}/${articleId}/comments`);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}

export async function addComment(articleId, body) {
  const r = await fetch(`${BASE}/${articleId}/comments`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

// ── Admin: Likes ──────────────────────────────────────────────────────────────
export const getAdminLikes       = ()               => req('GET',    `${BASE}/admin/likes`);
export const setArticleLikeCount = (id, count)      => req('PUT',    `${BASE}/admin/likes/${id}`, { count });
export const clearArticleLikes   = (id)             => req('DELETE', `${BASE}/admin/likes/${id}`);

// ── Admin: Comments ───────────────────────────────────────────────────────────
export const getAdminComments = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `${BASE}/admin/comments${qs ? '?' + qs : ''}`);
};
export const approveComment = (id) => req('PUT',    `${BASE}/admin/comments/${id}/approve`, {});
export const deleteComment  = (id) => req('DELETE', `${BASE}/admin/comments/${id}`);

export async function updateComment(id, formData) {
  const token = localStorage.getItem('vk_admin_token');
  const res   = await fetch(`${BASE}/admin/comments/${id}`, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function adminAddComment(formData) {
  const token = localStorage.getItem('vk_admin_token');
  const res   = await fetch(`${BASE}/admin/comments`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function uploadArticleImage(id, file) {
  const token = localStorage.getItem('vk_admin_token');
  const body = new FormData();
  body.append('image', file);
  const res = await fetch(`${BASE}/${id}/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
