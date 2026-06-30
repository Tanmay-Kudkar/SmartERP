import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Inject token and company id on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const companyId = localStorage.getItem('activeCompanyId');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (companyId) config.headers['x-company-id'] = companyId;
  return config;
});

// Auto logout on 401 and global error alert
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    } else {
      const msg = err.response?.data?.message || err.message || 'An unexpected server error occurred.';
      window.dispatchEvent(new CustomEvent('show-alert', {
        detail: {
          type: 'error',
          title: 'Application Error',
          message: msg
        }
      }));
    }
    return Promise.reject(err);
  }
);

export default api;
