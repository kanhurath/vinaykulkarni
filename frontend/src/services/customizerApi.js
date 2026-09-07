const BASE = `${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/customizer`;

async function req(method, url, body) {
  const token = localStorage.getItem('vk_admin_token');
  const res   = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const getCustomizer         = ()              => req('GET',  BASE);
export const getCustomizerSection  = (section)       => req('GET',  `${BASE}/${section}`);
export const saveCustomizerSection = (section, data) => req('PUT',  `${BASE}/${section}`, data);
