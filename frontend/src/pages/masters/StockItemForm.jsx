import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../api/client';

const GST_RATES = [0, 3, 5, 12, 18, 28];

export default function StockItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!id);
  const [units, setUnits] = useState([]);
  const [groups, setGroups] = useState([]);
  const isEdit = !!id;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { gst_percentage: 18, opening_stock: 0, purchase_price: 0, selling_price: 0, mrp: 0, reorder_level: 0 }
  });

  const sellingPrice = watch('selling_price');
  const gstPct = watch('gst_percentage');

  useEffect(() => {
    Promise.all([
      api.get('/stock/units'),
      api.get('/stock/groups'),
    ]).then(([ur, gr]) => {
      setUnits(ur.data.units);
      setGroups(gr.data.groups);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      setFetchLoading(true);
      api.get(`/stock/items/${id}`)
        .then(r => reset(r.data.item))
        .catch(() => toast.error('Failed to load item'))
        .finally(() => setFetchLoading(false));
    }
  }, [id]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/stock/items/${id}`, data);
        toast.success('Item updated!');
      } else {
        await api.post('/stock/items', data);
        toast.success('Item created!');
      }
      navigate('/stock/items');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Stock Item' : 'Create Stock Item'}</h1>
            <p className="page-subtitle">Define item with pricing and GST details</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Basic */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--accent-blue)' }}>Item Details</div>
            <div className="form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label className="erp-label">Item Name *</label>
                <input {...register('name', { required: 'Name required' })} className="erp-input" placeholder="e.g. Samsung TV 32 inch" autoFocus />
                {errors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
              </div>
              <div>
                <label className="erp-label">SKU / Code</label>
                <input {...register('sku')} className="erp-input" placeholder="ITEM-001" />
              </div>
              <div>
                <label className="erp-label">HSN Code</label>
                <input {...register('hsn_code')} className="erp-input" placeholder="8528" />
              </div>
              <div>
                <label className="erp-label">Stock Group</label>
                <select {...register('stock_group_id')} className="erp-select">
                  <option value="">No Group</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Unit of Measure *</label>
                <select {...register('unit_id', { required: 'Unit required' })} className="erp-select">
                  <option value="">Select Unit</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.symbol} - {u.name}</option>)}
                </select>
                {errors.unit_id && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.unit_id.message}</p>}
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="erp-label">Description</label>
                <textarea {...register('description')} className="erp-input" rows={2} placeholder="Optional description" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--accent-blue)' }}>Pricing & GST</div>
            <div className="form-grid">
              <div>
                <label className="erp-label">Purchase Price (₹)</label>
                <input {...register('purchase_price')} className="erp-input" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <label className="erp-label">Selling Price (₹)</label>
                <input {...register('selling_price')} className="erp-input" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <label className="erp-label">MRP (₹)</label>
                <input {...register('mrp')} className="erp-input" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <label className="erp-label">GST Rate (%)</label>
                <select {...register('gst_percentage')} className="erp-select">
                  {GST_RATES.map(r => <option key={r} value={r}>{r}% {r === 0 ? '(Exempt/Nil)' : ''}</option>)}
                </select>
              </div>
              {sellingPrice > 0 && gstPct > 0 && (
                <div style={{ gridColumn: '1/-1', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', padding: '0.75rem', display: 'flex', gap: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Taxable</div>
                    <div style={{ fontWeight: '600' }}>₹{parseFloat(sellingPrice).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CGST ({gstPct/2}%)</div>
                    <div style={{ fontWeight: '600' }}>₹{(sellingPrice * gstPct / 200).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SGST ({gstPct/2}%)</div>
                    <div style={{ fontWeight: '600' }}>₹{(sellingPrice * gstPct / 200).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginBottom: '0.25rem' }}>Total with GST</div>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>₹{(parseFloat(sellingPrice) * (1 + gstPct/100)).toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--accent-blue)' }}>Stock Settings</div>
            <div className="form-grid">
              <div>
                <label className="erp-label">Opening Stock</label>
                <input {...register('opening_stock')} className="erp-input" type="number" step="0.001" placeholder="0" />
              </div>
              <div>
                <label className="erp-label">Reorder Level</label>
                <input {...register('reorder_level')} className="erp-input" type="number" step="0.001" placeholder="0" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={15} />
              {loading ? 'Saving...' : isEdit ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
