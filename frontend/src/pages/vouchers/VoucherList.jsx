import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, ShoppingCart, Truck, Receipt } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import NeonSweepButton from '../../components/NeonSweepButton';

const TYPE_CONFIG = {
  sales: { label: 'Sales', badge: 'badge-green', icon: ShoppingCart, color: '#10b981' },
  purchase: { label: 'Purchase', badge: 'badge-blue', icon: Truck, color: '#3b82f6' },
};

export default function VoucherList() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 10;

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;
      const res = await api.get('/vouchers', { params });
      setVouchers(res.data.vouchers);
    } catch {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setPage(1); 
    fetchVouchers(); 
  }, [typeFilter, search]);

  const totalPages = Math.ceil(vouchers.length / ITEMS_PER_PAGE);
  const currentVouchers = vouchers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCancel = async (id, num) => {
    if (!window.confirm(`Cancel voucher ${num}? This will reverse stock changes.`)) return;
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('Voucher cancelled');
      fetchVouchers();
    } catch {
      toast.error('Failed to cancel voucher');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vouchers</h1>
          <p className="page-subtitle">All transactions · <kbd className="kbd">F8</kbd> Sales · <kbd className="kbd">F9</kbd> Purchase</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <Link to="/vouchers/sales/new" className="btn-success">
            <ShoppingCart size={15} /> Sales
          </Link>
          <Link to="/vouchers/purchase/new" className="btn-primary">
            <Truck size={15} /> Purchase
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="erp-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search by voucher no. or party..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="erp-select" style={{ width: 'auto', minWidth: '140px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="sales">Sales</option>
          <option value="purchase">Purchase</option>
        </select>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : vouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Receipt size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ marginBottom: '1rem' }}>No vouchers found.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/vouchers/sales/new" className="btn-success">New Sales</Link>
              <Link to="/vouchers/purchase/new" className="btn-primary">New Purchase</Link>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Taxable (₹)</th>
                  <th>GST (₹)</th>
                  <th>Total (₹)</th>
                  <th>Balance (₹)</th>
                  <th>Mode</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentVouchers.map(v => {
                  const tc = TYPE_CONFIG[v.voucher_type] || {};
                  return (
                    <tr key={v.id}>
                      <td data-label="Voucher #">
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-blue)', fontSize: '0.875rem' }}>
                          {v.voucher_number}
                        </span>
                      </td>
                      <td data-label="Type">
                        <span className={`badge ${tc.badge || 'badge-blue'}`}>{tc.label || v.voucher_type}</span>
                      </td>
                      <td data-label="Date" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(v.voucher_date).toLocaleDateString('en-IN')}
                      </td>
                      <td data-label="Party" style={{ fontWeight: '500' }}>{v.party_name || '—'}</td>
                      <td data-label="Taxable (₹)" style={{ textAlign: 'right' }}>₹{parseFloat(v.taxable_amount).toFixed(2)}</td>
                      <td data-label="GST (₹)" style={{ textAlign: 'right', color: '#f59e0b' }}>₹{parseFloat(v.total_gst).toFixed(2)}</td>
                      <td data-label="Total (₹)" style={{ textAlign: 'right', fontWeight: '700' }}>₹{parseFloat(v.grand_total).toFixed(2)}</td>
                      <td data-label="Balance (₹)" style={{ textAlign: 'right', fontWeight: '600', color: parseFloat(v.balance_amount) > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{parseFloat(v.balance_amount).toFixed(2)}
                      </td>
                      <td data-label="Mode">
                        <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>{v.payment_mode}</span>
                      </td>
                      <td className="action-cell">
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                          <NeonSweepButton tone="slate" size="sm" onClick={() => navigate(`/vouchers/${v.id}/view`)} title="View">
                            <Eye size={14} /> View
                          </NeonSweepButton>
                          <NeonSweepButton tone="danger" size="sm" onClick={() => handleCancel(v.id, v.voucher_number)} title="Cancel">
                            <Trash2 size={14} /> Cancel
                          </NeonSweepButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && vouchers.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div>
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, vouchers.length)} of {vouchers.length} vouchers
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn-secondary" 
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: '600' }}>
              Page {page} of {totalPages}
            </div>
            <button 
              className="btn-secondary" 
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
