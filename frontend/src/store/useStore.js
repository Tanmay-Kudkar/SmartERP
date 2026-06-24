import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth state
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, token: null, activeCompany: null });
  },

  // Company state
  activeCompany: JSON.parse(localStorage.getItem('activeCompany') || 'null'),

  setActiveCompany: (company) => {
    localStorage.setItem('activeCompany', JSON.stringify(company));
    localStorage.setItem('activeCompanyId', company?.id || '');
    set({ activeCompany: company });
  },

  // UI state
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  setTheme: (t) => {
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
    set({ theme: t });
  },
}));

export default useStore;
