import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, BookOpen, Package, ShoppingCart, Receipt, Users, Truck, Menu, X, LogOut, Building2, ChevronDown, Moon, Sun, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ]
  },
  {
    label: 'Masters',
    items: [
      { to: '/stock/items', icon: Package, label: 'Stock Items' },
      { to: '/stock/units', icon: Package, label: 'Units' },
    ]
  },
  {
    label: 'Vouchers',
    items: [
      { to: '/vouchers', icon: Receipt, label: 'All Vouchers' },
      { to: '/vouchers/sales/new', icon: ShoppingCart, label: 'Sales Voucher', kbd: 'F8' },
      { to: '/vouchers/purchase/new', icon: Truck, label: 'Purchase Voucher', kbd: 'F9' },
    ]
  },
  {
    label: 'Parties',
    items: [
      { to: '/ledgers?type=customer', icon: Users, label: 'Customers' },
      { to: '/ledgers?type=supplier', icon: Truck, label: 'Suppliers' },
      { to: '/ledgers', icon: BookOpen, label: 'Common Ledger' },
    ]
  },
];

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { activeCompany, user, logout, theme, setTheme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  useKeyboardShortcuts();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Overlay on Mobile */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }} 
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : (isMobile ? '0px' : '60px'),
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        overflow: 'hidden',
        zIndex: 100,
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Brand */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="#fff" />
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>SmartERP</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>v1.0 MVP</div>
            </div>
          )}
        </div>

        {/* Company Badge */}
        {sidebarOpen && activeCompany && (
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => navigate('/companies')}>
              <Building2 size={14} color="var(--accent-blue)" />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeCompany.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Click to switch</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '0.75rem 0.5rem' }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: '1.25rem' }}>
              {sidebarOpen && (
                <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.5rem', marginBottom: '0.375rem' }}>
                  {group.label}
                </div>
              )}
              {group.items.map(item => {
                const currentPath = location.pathname + location.search;
                // Custom active logic because NavLink ignores query params
                const isActive = item.to.includes('?') 
                  ? currentPath === item.to 
                  : location.pathname === item.to && !location.search;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={() => `nav-item ${isActive ? 'active' : ''}`}
                    style={{ marginBottom: '2px', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <item.icon size={17} style={{ flexShrink: 0 }} />
                    {sidebarOpen && (
                      <>
                        <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                        {item.kbd && <span className="kbd">{item.kbd}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border)' }}>
          <button
            className="nav-item"
            style={{ width: '100%', border: 'none', background: 'none', justifyContent: sidebarOpen ? 'flex-start' : 'center', color: '#ef4444' }}
            onClick={() => { logout(); navigate('/login'); }}
            title="Logout (Ctrl+Q)"
          >
            <LogOut size={17} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Top bar */}
        <header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 50 }}>
          <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
            {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#fff' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              {sidebarOpen && <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.name}</span>}
            </div>
          )}
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
