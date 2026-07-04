import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import AppLayout from './components/AppLayout';
import GlobalLoader from './components/GlobalLoader';
import TitleUpdater from './components/TitleUpdater';
import ServerWaking from './pages/ServerWaking';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CompanySelection from './pages/CompanySelection';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import ShortcutsGuide from './pages/ShortcutsGuide';
import Landing from './pages/Landing';

// Masters
import LedgerList from './pages/masters/LedgerList';
import LedgerForm from './pages/masters/LedgerForm';
import StockItemList from './pages/masters/StockItemList';
import StockItemForm from './pages/masters/StockItemForm';
import UnitList from './pages/masters/UnitList';

// Vouchers
import VoucherList from './pages/vouchers/VoucherList';
import VoucherForm from './pages/vouchers/VoucherForm';
import InvoiceView from './pages/vouchers/InvoiceView';

// Auth guard
function PrivateRoute({ children }) {
  const token = useStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }) {
  const token = useStore((s) => s.token);
  if (token) return <Navigate to="/companies" replace />;
  return children;
}

function AuthCompanyRoute() {
  const token = useStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <CompanySelection />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  // Persist health-check result for the lifetime of the browser tab.
  // sessionStorage clears when the tab is closed, so a fresh tab always
  // re-verifies. It is also cleared explicitly when the server goes to sleep.
  const [serverReady, setServerReady] = useState(
    () => sessionStorage.getItem('sw_ready') === '1'
  );

  // Mark server as confirmed-alive and cache it
  const handleReady = () => {
    sessionStorage.setItem('sw_ready', '1');
    setServerReady(true);
  };

  // If the server goes to sleep mid-session, clear the cache and show the
  // waking screen again
  useEffect(() => {
    const onSleep = () => {
      sessionStorage.removeItem('sw_ready');
      setServerReady(false);
    };
    window.addEventListener('server:sleeping', onSleep);
    return () => window.removeEventListener('server:sleeping', onSleep);
  }, []);

  if (!serverReady) {
    return <ServerWaking onReady={handleReady} />;
  }

  return (
    <BrowserRouter>
      <TitleUpdater />
      <GlobalLoader />
      <ScrollToTop />
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Company selection (auth required but no layout) */}
        <Route path="/companies" element={<AuthCompanyRoute />} />

        {/* Protected routes with sidebar layout */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        {/* Ledgers */}
        <Route path="/ledgers" element={<PrivateRoute><LedgerList /></PrivateRoute>} />
        <Route path="/ledgers/new" element={<PrivateRoute><LedgerForm /></PrivateRoute>} />
        <Route path="/ledgers/:id/edit" element={<PrivateRoute><LedgerForm /></PrivateRoute>} />

        {/* Stock */}
        <Route path="/stock/items" element={<PrivateRoute><StockItemList /></PrivateRoute>} />
        <Route path="/stock/items/new" element={<PrivateRoute><StockItemForm /></PrivateRoute>} />
        <Route path="/stock/items/:id/edit" element={<PrivateRoute><StockItemForm /></PrivateRoute>} />
        <Route path="/stock/units" element={<PrivateRoute><UnitList /></PrivateRoute>} />

        {/* Vouchers */}
        <Route path="/vouchers" element={<PrivateRoute><VoucherList /></PrivateRoute>} />
        <Route path="/vouchers/sales/new" element={<PrivateRoute><VoucherForm voucherType="sales" /></PrivateRoute>} />
        <Route path="/vouchers/purchase/new" element={<PrivateRoute><VoucherForm voucherType="purchase" /></PrivateRoute>} />
        <Route path="/vouchers/:id/view" element={<PrivateRoute><InvoiceView /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/shortcuts" element={<PrivateRoute><ShortcutsGuide /></PrivateRoute>} />

        {/* Catch-all */}
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
