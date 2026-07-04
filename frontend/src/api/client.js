import axios from 'axios';
import { notifyStart, notifyDone } from '../components/GlobalLoader';

let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
if (!baseURL.endsWith('/api') && baseURL !== '/api') {
  baseURL += '/api';
}

const api = axios.create({
  baseURL,
  timeout: 15000,
});

// Inject token, company id, and fire loading indicator
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const companyId = localStorage.getItem('activeCompanyId');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (companyId) config.headers['x-company-id'] = companyId;
  notifyStart();
  return config;
});

// Statuses that indicate the free-tier server is sleeping / starting up
const SLEEP_STATUSES = new Set([0, 502, 503, 504]);

// Auto logout on 401, sleeping detection, and global error alert
api.interceptors.response.use(
  (res) => { notifyDone(); return res; },
  (err) => {
    notifyDone();
    const status = err.response?.status;
    const isNetworkErr = !err.response; // no response = server unreachable
    const isSleeping   = isNetworkErr || SLEEP_STATUSES.has(status);

    if (isSleeping) {
      // Show the ServerWaking screen instead of an error dialog
      window.dispatchEvent(new Event('server:sleeping'));
    } else if (status === 401) {
      localStorage.clear();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      } else {
        return Promise.reject(err);
      }
    } else {
      const msg = err.response?.data?.message || err.message || 'An unexpected server error occurred.';
      window.dispatchEvent(new CustomEvent('show-alert', {
        detail: { type: 'error', title: 'Application Error', message: msg }
      }));
    }
    return Promise.reject(err);
  }
);

export default api;
