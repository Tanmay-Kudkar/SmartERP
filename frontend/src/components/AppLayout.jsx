import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, BookOpen, Package, ShoppingCart, Receipt, Users, Truck, Menu, X, LogOut, Building2, ChevronDown, Moon, Sun, BarChart3, Keyboard, Command, Search, ShieldAlert, CheckCircle2, AlertTriangle, Info, Bell, Settings, Database, Activity, Globe } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import YearSelectInput from './YearSelectInput';
import NeonSweepButton from './NeonSweepButton';

const navGroups = [
  {
    label: 'Main',
    icon: LayoutDashboard,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/shortcuts', icon: Keyboard, label: 'Shortcuts' },
    ]
  },
  {
    label: 'Masters',
    icon: Package,
    items: [
      { to: '/stock/items', icon: Package, label: 'Stock Items' },
      { to: '/stock/units', icon: Package, label: 'Units' },
    ]
  },
  {
    label: 'Vouchers',
    icon: Receipt,
    items: [
      { to: '/vouchers', icon: Receipt, label: 'All Vouchers' },
      { to: '/vouchers/sales/new', icon: ShoppingCart, label: 'Sales Voucher', kbd: 'F8' },
      { to: '/vouchers/purchase/new', icon: Truck, label: 'Purchase Voucher', kbd: 'F9' },
    ]
  },
  {
    label: 'Parties',
    icon: Users,
    items: [
      { to: '/ledgers?type=customer', icon: Users, label: 'Customers' },
      { to: '/ledgers?type=supplier', icon: Truck, label: 'Suppliers' },
      { to: '/ledgers', icon: BookOpen, label: 'Common Ledger' },
    ]
  },
];

const COMMANDS = [
  { label: 'Gateway of ERP (Dashboard)', action: (navigate) => navigate('/dashboard'), shortcut: 'Ctrl+H' },
  { label: 'Company Selection', action: (navigate) => navigate('/companies'), shortcut: 'F1' },
  { label: 'Change Financial Year', action: () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' })); }, shortcut: 'F2' },
  { label: 'Open Calculator', action: () => { window.dispatchEvent(new CustomEvent('toggle-calculator')); }, shortcut: 'F4' },
  { label: 'Shortcuts Guide', action: (navigate) => navigate('/shortcuts'), shortcut: '' },
  { label: 'Create Ledger', action: (navigate) => navigate('/ledgers/new'), shortcut: 'Alt+L' },
  { label: 'Alter Ledger (List)', action: (navigate) => navigate('/ledgers'), shortcut: 'Alt+A' },
  { label: 'Create Stock Item', action: (navigate) => navigate('/stock/items/new'), shortcut: 'Alt+S' },
  { label: 'Unit Creation', action: (navigate) => navigate('/stock/units?new=true'), shortcut: 'Alt+U' },
  { label: 'New Sales Voucher (Invoice)', action: (navigate) => navigate('/vouchers/sales/new'), shortcut: 'F8' },
  { label: 'New Purchase Voucher', action: (navigate) => navigate('/vouchers/purchase/new'), shortcut: 'F9' },
  { label: 'All Vouchers Register', action: (navigate) => navigate('/vouchers'), shortcut: 'Ctrl+V' },
  { label: 'Inventory Dashboard', action: (navigate) => navigate('/stock/items'), shortcut: 'Ctrl+I' },
  { label: 'New Customer', action: (navigate) => navigate('/ledgers/new?type=customer'), shortcut: 'Ctrl+C' },
  { label: 'New Supplier', action: (navigate) => navigate('/ledgers/new?type=supplier'), shortcut: 'Ctrl+S' },
  { label: 'Financial Summary Report', action: (navigate) => navigate('/reports?tab=financials'), shortcut: 'Alt+B' },
  { label: 'Trial Balance Report', action: (navigate) => navigate('/reports?tab=ledgers'), shortcut: 'Alt+T' },
  { label: 'Stock Summary Report', action: (navigate) => navigate('/reports?tab=stock'), shortcut: 'Alt+R' },
  { label: 'Logout Session', action: (navigate, logout) => { logout(); navigate('/login'); }, shortcut: 'Ctrl+Q' }
];

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { activeCompany, user, logout, theme, setTheme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  useKeyboardShortcuts();
  useSpatialNavigation();

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcVal, setCalcVal] = useState('');

  // Calculator Drag State
  const [calcOffset, setCalcOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCalc, setIsDraggingCalc] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0 });

  const handleDragStart = (e) => {
    setIsDraggingCalc(true);
    dragStartRef.current = {
      startX: e.clientX - calcOffset.x,
      startY: e.clientY - calcOffset.y,
    };
  };

  useEffect(() => {
    if (!isDraggingCalc) return;
    const handleDragMove = (e) => {
      setCalcOffset({
        x: e.clientX - dragStartRef.current.startX,
        y: e.clientY - dragStartRef.current.startY,
      });
    };
    const handleDragEnd = () => setIsDraggingCalc(false);
    
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDraggingCalc]);

  const [showPalette, setShowPalette] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [selectedCmdIdx, setSelectedCmdIdx] = useState(0);

  useEffect(() => {
    const handleTogglePalette = () => {
      setShowPalette(prev => !prev);
      setPaletteSearch('');
      setSelectedCmdIdx(0);
    };
    window.addEventListener('toggle-command-palette', handleTogglePalette);
    return () => window.removeEventListener('toggle-command-palette', handleTogglePalette);
  }, []);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  useEffect(() => {
    if (selectedCmdIdx >= filteredCommands.length) {
      setSelectedCmdIdx(Math.max(0, filteredCommands.length - 1));
    }
  }, [paletteSearch, filteredCommands.length]);

  useEffect(() => {
    if (!showPalette) return;
    const handlePaletteKeys = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCmdIdx(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCmdIdx(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedCmdIdx]) {
          filteredCommands[selectedCmdIdx].action(navigate, logout);
          setShowPalette(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPalette(false);
      }
    };
    window.addEventListener('keydown', handlePaletteKeys);
    return () => window.removeEventListener('keydown', handlePaletteKeys);
  }, [showPalette, selectedCmdIdx, filteredCommands, navigate, logout]);

  // Keep active command palette item in view
  useEffect(() => {
    if (showPalette) {
      const activeEl = document.getElementById(`cmd-item-${selectedCmdIdx}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedCmdIdx, showPalette]);

  const [showFYModal, setShowFYModal] = useState(false);
  const [fyStartYear, setFyStartYear] = useState(new Date().getFullYear());
  const [alertConfig, setAlertConfig] = useState(null);

  useEffect(() => {
    const handleOpenFYModal = () => {
      const activeCo = useStore.getState().activeCompany;
      if (activeCo) {
        const start = activeCo.financial_year_start ? new Date(activeCo.financial_year_start).getFullYear() : new Date().getFullYear();
        setFyStartYear(start);
        setShowFYModal(true);
      } else {
        setAlertConfig({
          type: 'error',
          title: 'Action Denied',
          message: 'You must select a company before managing the Financial Year.'
        });
      }
    };
    window.addEventListener('open-fy-modal', handleOpenFYModal);
    return () => window.removeEventListener('open-fy-modal', handleOpenFYModal);
  }, []);

  useEffect(() => {
    const handleShowAlert = (e) => {
      setAlertConfig(e.detail);
    };
    window.addEventListener('show-alert', handleShowAlert);
    return () => window.removeEventListener('show-alert', handleShowAlert);
  }, []);

  useEffect(() => {
    const isAnyModalOpen = showFYModal || alertConfig || showPalette || showCalculator;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFYModal, alertConfig, showPalette, showCalculator]);

  const handleSaveFY = () => {
    const activeCo = useStore.getState().activeCompany;
    if (!activeCo) return;

    // Check if the YearSelectInput popover is open
    const popoverOpen = !!document.querySelector('[data-fy-modal="true"] [data-year-popover-input="true"]');
    if (popoverOpen) {
      setAlertConfig({
        type: 'error',
        title: 'Pending Selection',
        message: "Please click 'Apply' inside the year popover to confirm your selection before saving."
      });
      return;
    }

    let startYear = fyStartYear;
    let endYear = startYear + 1;

    if (isNaN(startYear) || startYear < 1800 || startYear > 2100) {
      setAlertConfig({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a valid starting year between 1800 and 2100.'
      });
      return;
    }

    const prevStart = activeCo.financial_year_start ? new Date(activeCo.financial_year_start).getFullYear() : null;
    const prevEnd = activeCo.financial_year_end ? new Date(activeCo.financial_year_end).getFullYear() : null;

    if (prevStart === startYear && prevEnd === endYear) {
      setAlertConfig({
        type: 'warning',
        title: 'Identical Period',
        message: `The selected financial year (${startYear}-${endYear}) is identical to the current active financial year.`
      });
      return;
    }

    const updatedCompany = {
      ...activeCo,
      financial_year_start: `${startYear}-04-01`,
      financial_year_end: `${endYear}-03-31`
    };
    useStore.getState().setActiveCompany(updatedCompany);
    setShowFYModal(false);
    setAlertConfig({
      type: 'success',
      title: 'Financial Year Updated',
      message: `Successfully changed Financial Year to ${startYear}-${endYear} (1st April ${startYear} to 31st March ${endYear}).`
    });
  };

  useEffect(() => {
    const handleToggleCalc = () => setShowCalculator(prev => !prev);
    window.addEventListener('toggle-calculator', handleToggleCalc);
    return () => window.removeEventListener('toggle-calculator', handleToggleCalc);
  }, []);

  const handleCalcInput = (char) => {
    if (char === 'C') {
      setCalcVal('');
    } else if (char === '=') {
      try {
        const result = Function(`"use strict"; return (${calcVal})`)();
        setCalcVal(String(result));
      } catch {
        setCalcVal('Error');
      }
    } else {
      setCalcVal(prev => {
        if (prev === 'Error') return char;
        return prev + char;
      });
    }
  };

  useEffect(() => {
    if (!showCalculator) return;
    const handleCalcKeyPress = (e) => {
      // Don't intercept if user is typing in a form field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if ('0123456789+-*/.()'.includes(e.key)) {
        e.preventDefault();
        setCalcVal(prev => (prev === 'Error' ? e.key : prev + e.key));
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        try {
          const result = Function(`"use strict"; return (${calcVal})`)();
          setCalcVal(String(result));
        } catch {
          setCalcVal('Error');
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setCalcVal(prev => prev.slice(0, -1));
      } else if (e.key.toLowerCase() === 'c' || e.key === 'Delete') {
        e.preventDefault();
        setCalcVal('');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCalculator(false);
      }
    };
    window.addEventListener('keydown', handleCalcKeyPress);
    return () => window.removeEventListener('keydown', handleCalcKeyPress);
  }, [showCalculator, calcVal]);

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
        <div style={{ padding: sidebarOpen ? '1rem' : '1rem 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
          {sidebarOpen && (
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={18} color="#fff" />
            </div>
          )}
          {sidebarOpen && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>SmartERP</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>v1.0 MVP</div>
            </div>
          )}
          <button className="btn-icon" style={{ border: 'none', background: 'transparent', padding: '0.25rem' }} onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
            {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {/* Company Badge */}
        {sidebarOpen && activeCompany && (
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }} onClick={() => navigate('/companies')} title="Click to switch company (F1) / Change Financial Year (F2)">
              <Building2 size={16} color="var(--accent-blue)" style={{ marginTop: '2px' }} />
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeCompany.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  FY {new Date(activeCompany.financial_year_start).getFullYear()}-{new Date(activeCompany.financial_year_end).getFullYear().toString().slice(2)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active Company</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '0.75rem 0.5rem' }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: '1.25rem' }}>
              {sidebarOpen && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                  {group.icon && <group.icon size={12} color="var(--text-muted)" />}
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {group.label}
                  </div>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
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

        {/* Footer (Empty for now since Logout moved to Header) */}
        <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>SmartERP © 2026</div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Top bar */}
        <header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 50 }}>
          {/* Global Search Hint */}
          <div 
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.35rem 0.75rem', cursor: 'pointer', flex: '0 1 300px' }}
          >
            <Search size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>Search commands...</span>
            <span className="kbd" style={{ fontSize: '0.65rem' }}>Ctrl K</span>
          </div>

          <div style={{ flex: 1 }} />
          
          <button className="btn-icon" title="Notifications">
            <div style={{ position: 'relative' }}>
              <Bell size={17} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }} />
            </div>
          </button>

          <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#fff' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.name}</span>
              </div>
              <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>
              <button 
                className="btn-logout"
                onClick={() => { logout(); navigate('/login'); }}
                title="Logout"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
          {children}
        </main>

        {/* ERP Status Bar */}
        <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '0.35rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={12} />
              <span>{activeCompany?.name || 'No Company'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={12} />
              <span>FY {activeCompany ? `${new Date(activeCompany.financial_year_start).getFullYear()}-${new Date(activeCompany.financial_year_end).getFullYear().toString().slice(2)}` : 'N/A'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Activity size={12} color="#10b981" />
              <span>Server Online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={12} color="#3b82f6" />
              <span>Sync Complete</span>
            </div>
          </div>
        </div>
      </div>

      {showCalculator && (
        <div 
          data-calculator-open="true"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            transform: `translate(${calcOffset.x}px, ${calcOffset.y}px)`,
            width: '260px',
            background: 'var(--card-glass-bg)',
            backdropFilter: 'blur(12px)',
            border: '3px solid #000',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.15)',
            padding: '1rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            userSelect: isDraggingCalc ? 'none' : 'auto',
          }}
        >
          {/* Header */}
          <div 
            onMouseDown={handleDragStart}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid var(--border-subtle)', 
              paddingBottom: '0.5rem',
              cursor: isDraggingCalc ? 'grabbing' : 'grab'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Smart Calculator (F4)</span>
            <button 
              onClick={() => setShowCalculator(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700' }}
            >
              ×
            </button>
          </div>

          {/* Screen */}
          <input
            type="text"
            placeholder="0"
            value={calcVal}
            onChange={(e) => setCalcVal(e.target.value.replace(/[^0-9+\-*/.()]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                try {
                  const result = Function(`"use strict"; return (${calcVal})`)();
                  setCalcVal(String(result));
                } catch {
                  setCalcVal('Error');
                }
              } else if (e.key === 'Escape') {
                setShowCalculator(false);
              }
            }}
            style={{
              width: '100%',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              textAlign: 'right',
              fontSize: '1.25rem',
              fontFamily: 'monospace',
              height: '45px',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Grid of keys */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
          }}>
            {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map(char => {
              const isOperator = ['/', '*', '-', '+', '=', 'C', '(', ')'].includes(char);
              return (
                <button
                  key={char}
                  onClick={() => handleCalcInput(char)}
                  style={{
                    padding: '0.6rem',
                    fontSize: '1rem',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    borderRadius: '8px',
                    border: '2px solid #000',
                    boxShadow: '0 2px 0 #000',
                    background: char === '=' ? '#2563eb' : 
                                char === 'C' ? '#ef4444' : 
                                ['/', '*', '-', '+'].includes(char) ? '#f59e0b' : 
                                ['(', ')'].includes(char) ? '#64748b' : 'var(--bg-primary)',
                    color: (isOperator || char === '=') ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    gridColumn: char === '0' ? 'span 2' : 'auto',
                    transition: 'all 0.1s',
                  }}
                  onMouseDown={e => {
                    e.currentTarget.style.transform = 'translateY(2px)';
                    e.currentTarget.style.boxShadow = '0 0 0 #000';
                  }}
                  onMouseUp={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 0 #000';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 0 #000';
                  }}
                >
                  {char}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Keyboard size={12} />
            <span>Keyboard supported (Enter, C, Del)</span>
          </div>
        </div>
      )}

      {showPalette && (
        <div 
          data-palette-open="true"
          onClick={() => setShowPalette(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'center',
            paddingTop: '10vh'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '640px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 40px rgba(59, 130, 246, 0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '70vh'
            }}
          >
            {/* Search Input Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <Command size={20} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
              <input 
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1.15rem', padding: 0, color: 'var(--text-primary)', fontWeight: '500' }}
                placeholder="Search commands or pages..."
                value={paletteSearch}
                onChange={e => { setPaletteSearch(e.target.value); setSelectedCmdIdx(0); }}
                autoFocus
              />
              <kbd className="kbd" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'var(--bg-primary)' }}>ESC</kbd>
            </div>

            {/* Commands List */}
            <div style={{ overflowY: 'auto', padding: '0.5rem' }}>
              {filteredCommands.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  No commands found. Try something else.
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = idx === selectedCmdIdx;
                  return (
                    <div 
                      key={cmd.label}
                      id={`cmd-item-${idx}`}
                      onClick={() => { cmd.action(navigate, logout); setShowPalette(false); }}
                      onMouseEnter={() => setSelectedCmdIdx(idx)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--accent-blue)' : 'transparent',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontWeight: isSelected ? '600' : '500' }}>
                        {cmd.label}
                      </span>
                      {cmd.shortcut && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-primary)',
                          border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)'
                        }}>
                          {cmd.shortcut}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer tips */}
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', fontWeight: '500' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Use <span style={{ fontWeight: '700' }}>↑↓</span> to navigate, <span style={{ fontWeight: '700' }}>Enter</span> to select
              </span>
              <span>Command Palette</span>
            </div>
          </div>
        </div>
      )}
      {showFYModal && (
        <div 
          data-fy-modal="true"
          onClick={() => setShowFYModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: alertConfig ? 'transparent' : 'rgba(5, 8, 16, 0.75)',
            backdropFilter: alertConfig ? 'none' : 'blur(10px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            pointerEvents: alertConfig ? 'none' : 'auto',
            transition: 'all 0.25s ease'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(59, 130, 246, 0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              opacity: alertConfig ? 0.35 : 1,
              transform: alertConfig ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={16} /> Change Financial Year
              </div>
              <button 
                onClick={() => setShowFYModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '700' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="erp-label">Financial Year (Starting April 1st) *</label>
                <YearSelectInput 
                  value={fyStartYear} 
                  onChange={setFyStartYear} 
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Select calendar start year. The financial year will span exactly 12 months.
                </p>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowFYModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveFY}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {alertConfig && (
        <div 
          data-alert-modal="true"
          onClick={() => setAlertConfig(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--bg-secondary)',
              border: alertConfig.type === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : 
                      alertConfig.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.4)' : 
                      alertConfig.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : 
                      '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                background: alertConfig.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 
                            alertConfig.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 
                            alertConfig.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 
                            'rgba(59, 130, 246, 0.15)',
              }}>
                {alertConfig.type === 'error' && <ShieldAlert size={22} color="#ef4444" />}
                {alertConfig.type === 'warning' && <AlertTriangle size={22} color="#f59e0b" />}
                {alertConfig.type === 'success' && <CheckCircle2 size={22} color="#10b981" />}
                {(alertConfig.type === 'info' || !alertConfig.type) && <Info size={22} color="#3b82f6" />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontWeight: '700', 
                  fontSize: '1rem', 
                  color: alertConfig.type === 'error' ? '#ef4444' : 
                         alertConfig.type === 'warning' ? '#f59e0b' : 
                         alertConfig.type === 'success' ? '#10b981' : 
                         'var(--text-primary)',
                  marginBottom: '0.35rem'
                }}>
                  {alertConfig.title || 'Notification'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {alertConfig.message}
                </p>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-primary" 
                style={{ 
                  background: alertConfig.type === 'error' ? '#ef4444' : 
                              alertConfig.type === 'warning' ? '#f59e0b' : 
                              alertConfig.type === 'success' ? '#10b981' : 
                              'var(--accent-blue)',
                  borderColor: 'transparent',
                  color: '#fff',
                  padding: '0.45rem 1.25rem',
                  fontSize: '0.85rem'
                }} 
                onClick={() => setAlertConfig(null)}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
