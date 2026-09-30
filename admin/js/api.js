/**
 * GramSetu — Administration API Service
 */

// Determine backend API URL:
// 1. Explicitly configured window.GRAMSETU_API_URL (e.g. for Vercel/Netlify with separate backend)
// 2. localStorage 'gramsetu_api_url' if custom backend set in browser
// 3. Fallback to Cloud Run URL if opened directly from local disk (file://)
// 4. Default: '' (same-origin relative paths) for full-stack Node.js / Cloud Run / monolithic deployments
const customApiUrl = (typeof window !== 'undefined' && window.GRAMSETU_API_URL) ||
  (typeof localStorage !== 'undefined' && localStorage.getItem('gramsetu_api_url'));

const isFileProtocol = window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null';
const CLOUD_FALLBACK_URL = 'https://ais-dev-ptlsfomcub266wrjfr2qip-698902776013.asia-southeast1.run.app';

const API_BASE = customApiUrl ? customApiUrl.replace(/\/+$/, '') : (isFileProtocol ? CLOUD_FALLBACK_URL : '');

async function adminRequest(endpoint, options = {}) {
  const token = localStorage.getItem('gramsetu_admin_token');
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({
      success: false,
      error: `Server returned invalid response (HTTP ${response.status})`,
    }));

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('admin-login')) {
        localStorage.removeItem('gramsetu_admin_token');
        localStorage.removeItem('gramsetu_admin_user');
        window.location.href = '/admin/index.html?expired=1';
        return;
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`Admin API Error on ${endpoint}:`, err);
    throw err;
  }
}

const adminApi = {
  // System Health
  getHealth: () => fetch(`${API_BASE}/api/health`).then((r) => r.json()),

  // Admin Auth (Sends credentials to backend, verified on server)
  login: (username, password) =>
    adminRequest('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (payload) =>
    adminRequest('/api/auth/admin-register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin Dashboard & Grievance Ledger
  getDashboard: () => adminRequest('/api/admin/dashboard'),

  getComplaints: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return adminRequest(`/api/admin/complaints${qs}`);
  },

  getComplaintById: (id) => adminRequest(`/api/admin/complaints/${id}`),

  updateComplaint: (id, payload) =>
    adminRequest(`/api/admin/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

window.adminApi = adminApi;
