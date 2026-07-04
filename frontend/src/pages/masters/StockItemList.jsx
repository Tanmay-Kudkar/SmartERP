import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import NeonSweepButton from '../../components/NeonSweepButton';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function StockItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 10;

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/stock/items', { params });
      setItems(res.data.items);
    } catch {
      toast.error('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setPage(1);
    fetchItems(); 
  }, [search]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDelete = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/stock/items/${deleteTarget.id}`);
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Cannot delete item');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Items</h1>
          <p className="page-subtitle">Manage inventory items and products · <kbd className="kbd">Alt+S</kbd> New · <kbd className="kbd">Ctrl+I</kbd> Inventory</p>
        </div>
        <Link to="/stock/items/new" className="btn-primary">
          <Plus size={16} /> New Item
        </Link>
      </div>

      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '400px' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="erp-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ marginBottom: '1rem' }}>No stock items found.</p>
            <Link to="/stock/items/new" className="btn-primary">Add First Item</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Group</th>
                  <th>Unit</th>
                  <th>Purchase ₹</th>
                  <th>Selling ₹</th>
                  <th>GST %</th>
                  <th>Stock</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr key={item.id}>
                    <td data-label="Item Name">
                      <div style={{ fontWeight: '600' }}>{item.name}</div>
                      {item.hsn_code && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HSN: {item.hsn_code}</div>}
                    </td>
                    <td data-label="SKU" style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.sku || '—'}</td>
                    <td data-label="Group" style={{ color: 'var(--text-secondary)' }}>{item.group_name || '—'}</td>
                    <td data-label="Unit"><span className="badge badge-blue">{item.unit_symbol || '—'}</span></td>
                    <td data-label="Purchase ₹" style={{ color: 'var(--text-secondary)' }}>₹{parseFloat(item.purchase_price).toLocaleString('en-IN')}</td>
                    <td data-label="Selling ₹" style={{ fontWeight: '600', color: '#10b981' }}>₹{parseFloat(item.selling_price).toLocaleString('en-IN')}</td>
                    <td data-label="GST %">
                      {item.gst_percentage > 0 ? (
                        <span className="badge badge-orange">{item.gst_percentage}%</span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>Nil</span>}
                    </td>
                    <td data-label="Stock">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ fontWeight: '700', color: item.current_stock <= item.reorder_level ? '#ef4444' : '#10b981' }}>
                          {parseFloat(item.current_stock).toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.unit_symbol}</span>
                        {item.current_stock <= item.reorder_level && item.reorder_level > 0 && (
                          <AlertTriangle size={13} color="#f59e0b" title="Low stock!" />
                        )}
                      </div>
                    </td>
                    <td className="action-cell">
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                        <NeonSweepButton tone="slate" size="sm" onClick={() => navigate(`/stock/items/${item.id}/edit`)} title="Edit">
                          <Pencil size={14} /> Edit
                        </NeonSweepButton>
                        <NeonSweepButton tone="danger" size="sm" onClick={() => confirmDelete(item.id, item.name)} title="Delete">
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

      {!loading && items.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div>
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, items.length)} of {items.length} item{items.length !== 1 ? 's' : ''}
            {items.filter(i => i.current_stock <= i.reorder_level && i.reorder_level > 0).length > 0 && 
              ` · ${items.filter(i => i.current_stock <= i.reorder_level && i.reorder_level > 0).length} low stock`}
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

      <ConfirmDialog 
        isOpen={!!deleteTarget}
        title="Delete Stock Item"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
