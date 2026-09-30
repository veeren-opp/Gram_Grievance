/**
 * GramSetu — Citizen API Service
 * Centralized HTTP client communicating with Node.js/Express Backend
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

/**
 * Fetch wrapper with Authorization header and error normalization
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('gramsetu_citizen_token');
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set default JSON Content-Type only if not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({
      success: false,
      error: `Server returned invalid JSON (HTTP ${response.status})`,
    }));

    if (!response.ok) {
      // If unauthorized, token expired
      if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        localStorage.removeItem('gramsetu_citizen_token');
        localStorage.removeItem('gramsetu_citizen_user');
        window.location.href = '/citizen/login.html?expired=1';
        return;
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

const api = {
  // Health & Diagnostics
  getHealth: () => request('/api/health'),

  // Auth endpoints
  register: (payload) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Citizen data endpoints
  getProfile: () => request('/api/citizen/profile'),
  getDashboard: () => request('/api/citizen/dashboard'),
  getComplaints: () => request('/api/citizen/complaints'),

  // Complaint endpoints
  getComplaintById: (id) => request(`/api/complaints/${id}`),
  submitComplaint: (formData) =>
    request('/api/complaints', {
      method: 'POST',
      body: formData,
    }),
};

window.api = api;
