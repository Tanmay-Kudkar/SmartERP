import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertCircle, Package, ShoppingCart, Truck, BookOpen, ArrowRight, Receipt } from 'lucide-react';
import api from '../api/client';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon: Icon, color, gradient, subtitle }) {
  return (
    <div className="stat-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : value}
          </div>
          {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</div>}
        </div>
        <div style={{ width: '42px', height: '42px', background: gradient, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="#fff" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, desc, icon: Icon, color, kbd, to, navigate }) {
  return (
    <div
      className="glass-card"
      style={{ padding: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={() => navigate(to)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{ width: '38px', height: '38px', background: `${color}20`, border: `1px solid ${color}40`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{desc}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {kbd && <span className="kbd">{kbd}</span>}
          <ArrowRight size={14} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeCompany } = useStore();
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

  const quickActions = [
    { label: 'New Sales Voucher', desc: 'Create customer bill with GST', icon: ShoppingCart, color: '#10b981', kbd: 'F8', to: '/vouchers/sales/new' },
    { label: 'New Purchase Voucher', desc: 'Record supplier purchase', icon: Truck, color: '#3b82f6', kbd: 'F9', to: '/vouchers/purchase/new' },
    { label: 'Create Ledger', desc: 'Add customer or supplier', icon: BookOpen, color: '#8b5cf6', kbd: 'Alt+L', to: '/ledgers/new' },
    { label: 'Add Stock Item', desc: 'New product or inventory item', icon: Package, color: '#f59e0b', kbd: 'Alt+S', to: '/stock/items/new' },
    { label: 'View All Vouchers', desc: 'Browse transaction history', icon: Receipt, color: '#06b6d4', to: '/vouchers' },
    { label: 'Stock Items List', desc: 'Manage inventory', icon: Package, color: '#ec4899', to: '/stock/items' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gateway of SmartERP</h1>
          <p className="page-subtitle">{activeCompany.name} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Sales" value={summary?.total_sales || 0} icon={TrendingUp} color="#10b981" gradient="linear-gradient(135deg, #10b981, #059669)" />
        <StatCard label="Total Purchases" value={summary?.total_purchases || 0} icon={TrendingDown} color="#3b82f6" gradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
        <StatCard label="Outstanding" value={summary?.total_outstanding || 0} icon={AlertCircle} color="#f59e0b" gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
        <StatCard label="Stock Items" value={summary?.stock_items || 0} icon={Package} color="#8b5cf6" gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" subtitle="Active items" />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {quickActions.map(a => <QuickAction key={a.label} {...a} navigate={navigate} />)}
        </div>
      </div>

      {/* Keyboard Shortcuts Panel */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Keyboard Shortcuts</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {[
            ['F1', 'Company Selection'],
            ['F8', 'Sales Voucher'],
            ['F9', 'Purchase Voucher'],
            ['Alt+L', 'Create Ledger'],
            ['Alt+A', 'Alter Ledger'],
            ['Alt+S', 'Create Stock Item'],
            ['Alt+U', 'Unit Creation'],
            ['Ctrl+I', 'Inventory'],
            ['Ctrl+N', 'New Item'],
            ['Ctrl+B', 'New Invoice'],
            ['Ctrl+H', 'Home'],
            ['Ctrl+Q', 'Logout'],
            ['Esc', 'Go Back'],
          ].map(([kbd, label]) => (
            <div key={kbd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="kbd">{kbd}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
