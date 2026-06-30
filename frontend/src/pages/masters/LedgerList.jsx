import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, BookOpen, Filter } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import NeonSweepButton from '../../components/NeonSweepButton';

const TYPE_LABELS = {
  customer: { label: 'Customer', plural: 'customers', color: '#10b981', badge: 'badge-green' },
  supplier: { label: 'Supplier', plural: 'suppliers', color: '#3b82f6', badge: 'badge-blue' },
  expense: { label: 'Expense', plural: 'expenses', color: '#f59e0b', badge: 'badge-orange' },
  income: { label: 'Income', plural: 'income accounts', color: '#8b5cf6', badge: 'badge-purple' },
  bank: { label: 'Bank', plural: 'bank accounts', color: '#06b6d4', badge: 'badge-blue' },
  cash: { label: 'Cash', plural: 'cash accounts', color: '#10b981', badge: 'badge-green' },
};

export default function LedgerList() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 10;
  const [searchParams, setSearchParams] = useSearchParams();

  const typeFilter = searchParams.get('type') || '';

  const setTypeFilter = (val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set('type', val);
    } else {
      newParams.delete('type');
    }
    setSearchParams(newParams);
  };

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/ledgers', { params });
      setLedgers(res.data.ledgers);
    } catch {
      toast.error('Failed to load ledgers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setPage(1);
    fetchLedgers(); 
  }, [typeFilter, search]);

  const totalPages = Math.ceil(ledgers.length / ITEMS_PER_PAGE);
  const currentLedgers = ledgers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ledger "${name}"?`)) return;
    try {
      await api.delete(`/ledgers/${id}`);
      toast.success('Ledger deleted');
      fetchLedgers();
    } catch {
      toast.error('Cannot delete this ledger');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ledgers</h1>
          <p className="page-subtitle">Manage accounts, customers, and suppliers · <kbd className="kbd">Alt+L</kbd> New · <kbd className="kbd">Alt+A</kbd> List</p>
        </div>
        <Link to={typeFilter ? `/ledgers/new?type=${typeFilter}` : "/ledgers/new"} className="btn-primary">
          <Plus size={16} /> New {typeFilter ? TYPE_LABELS[typeFilter]?.label : 'Ledger'}
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="erp-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search ledgers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="erp-select" style={{ width: 'auto', minWidth: '140px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : ledgers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            {search ? (
              <>
                <p style={{ marginBottom: '1rem' }}>
                  No {typeFilter ? TYPE_LABELS[typeFilter]?.plural : 'ledgers'} found matching "{search}".
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setSearch('')} 
                    className="btn-secondary"
                  >
                    Clear Search
                  </button>
                  <Link 
                    to={typeFilter ? `/ledgers/new?type=${typeFilter}` : "/ledgers/new"} 
                    className="btn-primary"
                  >
                    Add {typeFilter ? TYPE_LABELS[typeFilter]?.label : 'Ledger'}
                  </Link>
                </div>
              </>
            ) : typeFilter ? (
              <>
                <p style={{ marginBottom: '1rem' }}>No {TYPE_LABELS[typeFilter]?.plural || 'ledgers'} found.</p>
                <Link 
                  to={`/ledgers/new?type=${typeFilter}`} 
                  className="btn-primary"
                >
                  Create First {TYPE_LABELS[typeFilter]?.label || 'Ledger'}
                </Link>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '1rem' }}>No ledgers found.</p>
                <Link to="/ledgers/new" className="btn-primary">Create First Ledger</Link>
              </>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Group</th>
                  <th>GST No.</th>
                  <th>Phone</th>
                  <th>Opening Bal.</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentLedgers.map(l => (
                  <tr key={l.id}>
                    <td data-label="Name">
                      <div style={{ fontWeight: '600' }}>{l.name}</div>
                      {l.city && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.city}{l.state ? `, ${l.state}` : ''}</div>}
                    </td>
                    <td data-label="Type">
                      <span className={`badge ${TYPE_LABELS[l.ledger_type]?.badge || 'badge-blue'}`}>
                        {TYPE_LABELS[l.ledger_type]?.label || l.ledger_type}
                      </span>
                    </td>
                    <td data-label="Group" style={{ color: 'var(--text-secondary)' }}>{l.group_name || '—'}</td>
                    <td data-label="GST No." style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{l.gst_number || '—'}</td>
                    <td data-label="Phone" style={{ color: 'var(--text-secondary)' }}>{l.phone || '—'}</td>
                    <td data-label="Opening Bal." style={{ fontWeight: '600', color: l.opening_balance > 0 ? '#10b981' : l.opening_balance < 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                      {l.opening_balance != 0 ? `₹${Math.abs(l.opening_balance).toLocaleString('en-IN')} ${l.balance_type}` : '—'}
                    </td>
                    <td className="action-cell">
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                        <NeonSweepButton tone="slate" size="sm" onClick={() => navigate(`/ledgers/${l.id}/edit${typeFilter ? `?type=${typeFilter}` : ''}`)} title="Edit">
                          <Pencil size={14} /> Edit
                        </NeonSweepButton>
                        <NeonSweepButton tone="danger" size="sm" onClick={() => handleDelete(l.id, l.name)} title="Delete">
                          <Trash2 size={14} /> Delete
                        </NeonSweepButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && ledgers.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div>
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, ledgers.length)} of {ledgers.length} ledger{ledgers.length !== 1 ? 's' : ''}
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
