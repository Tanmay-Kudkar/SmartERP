import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertCircle, Package, ShoppingCart, Truck, BookOpen, ArrowRight, Receipt, Clock, Landmark, Wallet, ArrowUpRight, ArrowDownRight, CreditCard, CheckCircle2, Building2, Zap, Keyboard } from 'lucide-react';
import api from '../api/client';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon: Icon, cssClass, iconColor, subtitle, isCurrency = true, trend, progress }) {
  const [displayValue, setDisplayValue] = useState(typeof value === 'number' ? 0 : value);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }
    
    let startTimestamp = null;
    const duration = 1200; // 1.2s animation duration
    let animationFrameId;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart curve for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(easeProgress * value);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    
    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return (
    <div className={`stat-card ${cssClass}`} style={{ transition: 'transform 0.2s', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : value}>
            {typeof displayValue === 'number'
              ? (isCurrency ? `₹${displayValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : Math.floor(displayValue).toLocaleString('en-IN'))
              : displayValue}
          </div>
          
          {trend && (
            <div style={{ fontSize: '0.7rem', color: trend.isPositive ? '#10b981' : '#ef4444', marginTop: '0.35rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {trend.isPositive ? '▲' : '▼'} {trend.value}
              <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>from last month</span>
            </div>
          )}
          
          {progress && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>
                <span>{progress.label}</span>
                <span>{progress.percent}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${progress.percent}%`, height: '100%', background: iconColor }} />
              </div>
            </div>
          )}
          
          {subtitle && !trend && !progress && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</div>}
        </div>
        <div style={{ width: '42px', height: '42px', background: 'var(--bg-card)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <Icon size={20} color={iconColor} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, desc, icon: Icon, color, kbd, to, navigate }) {
  return (
    <div
      className="glass-card quick-action-card"
      style={{ padding: '1rem', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center' }}
      onClick={() => navigate(to)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', width: '100%' }}>
        <div style={{ width: '38px', height: '38px', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {kbd && <span className="kbd">{kbd}</span>}
          <ArrowRight className="arrow-icon" size={14} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeCompany, user, trackShortcut, shortcutUsage } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/vouchers/summary/dashboard');
        setSummary(res.data.summary);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    if (activeCompany) fetchSummary();
    else setLoading(false);
  }, [activeCompany]);

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <AlertCircle size={48} color="var(--text-muted)" />
        <p style={{ color: 'var(--text-muted)' }}>No company selected.</p>
        <button className="btn-primary" onClick={() => navigate('/companies')}>Select Company</button>
      </div>
    );
  }

  // Master list of frequently used shortcuts to rank
  const allShortcuts = [
    { kbd: 'F1', label: 'Company Selection', action: () => navigate('/companies') },
    { kbd: 'F2', label: 'Change Financial Year', action: () => window.dispatchEvent(new CustomEvent('open-fy-modal')) },
    { kbd: 'F4', label: 'Calculator', action: () => window.dispatchEvent(new CustomEvent('toggle-calculator')) },
    { kbd: 'F8', label: 'Sales Voucher', action: () => navigate('/vouchers/sales/new') },
    { kbd: 'F9', label: 'Purchase Voucher', action: () => navigate('/vouchers/purchase/new') },
    { kbd: 'Alt+L', label: 'Create Ledger', action: () => navigate('/ledgers/new') },
    { kbd: 'Alt+S', label: 'Create Stock Item', action: () => navigate('/stock/items/new') },
    { kbd: 'Alt+A', label: 'All Ledgers', action: () => navigate('/ledgers') },
    { kbd: 'Ctrl+V', label: 'Vouchers Register', action: () => navigate('/vouchers') },
    { kbd: 'Ctrl+I', label: 'Inventory Dashboard', action: () => navigate('/stock/items') },
    { kbd: 'Ctrl+K', label: 'Command Palette', action: () => window.dispatchEvent(new CustomEvent('toggle-command-palette')) },
    { kbd: 'Ctrl+H', label: 'Dashboard / Home', action: () => navigate('/dashboard') },
  ];

  // Get company-specific usage
  const companyUsage = shortcutUsage?.[activeCompany?.id] || {};
  
  // Sort shortcuts by usage count (descending), fallback to original order
  const rankedShortcuts = [...allShortcuts].sort((a, b) => {
    const countA = companyUsage[a.kbd] || 0;
    const countB = companyUsage[b.kbd] || 0;
    return countB - countA;
  }).slice(0, 8); // Balanced height

  const handleShortcutClick = (kbd, action) => {
    if (trackShortcut) trackShortcut(activeCompany?.id, kbd);
    action();
  };

  const quickActions = [
    { label: 'New Sales Voucher', desc: 'Create customer bill with GST', icon: ShoppingCart, color: '#10b981', kbd: 'F8', to: '/vouchers/sales/new' },
    { label: 'New Purchase Voucher', desc: 'Record supplier purchase', icon: Truck, color: '#3b82f6', kbd: 'F9', to: '/vouchers/purchase/new' },
    { label: 'Create Ledger', desc: 'Add customer or supplier', icon: BookOpen, color: '#8b5cf6', kbd: 'Alt+L', to: '/ledgers/new' },
    { label: 'Add Stock Item', desc: 'New product or inventory item', icon: Package, color: '#f59e0b', kbd: 'Alt+S', to: '/stock/items/new' },
    { label: 'View All Vouchers', desc: 'Browse transaction history', icon: Receipt, color: '#06b6d4', to: '/vouchers' },
    { label: 'Stock Items List', desc: 'Manage inventory', icon: Package, color: '#ec4899', to: '/stock/items' },
  ];

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            👋 {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
          </div>
          <h1 className="page-title">Gateway of SmartERP</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={14} color="var(--accent-blue)" />
              {activeCompany.name}
            </span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>FY {new Date(activeCompany.financial_year_start).getFullYear()}–{new Date(activeCompany.financial_year_end).getFullYear().toString().slice(2)}</span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <StatCard label="Total Sales" value={summary?.total_sales || 0} icon={TrendingUp} cssClass="kpi-sales" iconColor="#10b981" />
        <StatCard label="Total Purchases" value={summary?.total_purchases || 0} icon={TrendingDown} cssClass="kpi-purchases" iconColor="#3b82f6" />
        <StatCard label="Outstanding" value={summary?.total_outstanding || 0} icon={AlertCircle} cssClass="kpi-outstanding" iconColor="#f59e0b" />
        <StatCard label="Stock Items" value={summary?.stock_items || 0} icon={Package} cssClass="kpi-inventory" iconColor="#8b5cf6" isCurrency={false} />
      </div>

      {/* Secondary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Bank Balance" value={summary?.bank_balance || 0} icon={Landmark} cssClass="kpi-bank" iconColor="#7c3aed" />
        <StatCard label="Cash in Hand" value={summary?.cash_balance || 0} icon={Wallet} cssClass="kpi-cash" iconColor="#06b6d4" />
        <StatCard label="Receivables" value={summary?.receivables || 0} icon={ArrowUpRight} cssClass="kpi-receivable" iconColor="#10b981" />
        <StatCard label="Payables" value={summary?.payables || 0} icon={ArrowDownRight} cssClass="kpi-payable" iconColor="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Quick Actions & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={14} /> Quick Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gridAutoRows: '1fr', gap: '0.75rem' }}>
              {quickActions.map(a => <QuickAction key={a.label} {...a} navigate={navigate} />)}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={14} /> Recent Vouchers
            </div>
            {(!summary?.recent_vouchers || summary.recent_vouchers.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>No recent activity found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {summary.recent_vouchers.map(v => (
                  <div key={v.id} className="quick-action-card" onClick={() => navigate(`/vouchers/${v.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: v.voucher_type === 'sales' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.voucher_type === 'sales' ? '#10b981' : '#3b82f6', border: `1px solid ${v.voucher_type === 'sales' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                        {v.voucher_type === 'sales' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{v.voucher_type === 'sales' ? 'Sales' : 'Purchase'} <span style={{ color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.8rem', marginLeft: '0.35rem' }}>#{v.voucher_number}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{v.party_name || 'Cash'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>₹{parseFloat(v.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{new Date(v.voucher_date).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Summary & Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={14} /> This Month's Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <TrendingUp size={14} color="#10b981" /> Sales
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>₹{summary?.today_sales?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <TrendingDown size={14} color="#3b82f6" /> Purchases
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>₹{summary?.today_purchases?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <CreditCard size={14} color="#8b5cf6" /> Receipts
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>₹{summary?.today_receipts?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Keyboard size={14} /> Frequently Used
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rankedShortcuts.map(({ kbd, label, action }) => (
                <div 
                  key={kbd} 
                  className="quick-action-card" 
                  onClick={() => handleShortcutClick(kbd, action)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
                  <span className="kbd">{kbd}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
