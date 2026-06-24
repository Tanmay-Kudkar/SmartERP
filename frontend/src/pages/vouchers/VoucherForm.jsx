import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Eye, Printer } from 'lucide-react';
import api from '../../api/client';
import useStore from '../../store/useStore';
import NeonSweepButton from '../../components/NeonSweepButton';

const today = () => new Date().toISOString().split('T')[0];

function LineItem({ index, item, onUpdate, onRemove, stockItems, units }) {
  const handleItemChange = (stockItemId) => {
    const found = stockItems.find(s => String(s.id) === String(stockItemId));
    if (found) {
      onUpdate(index, {
        ...item,
        stock_item_id: found.id,
        item_name: found.name,
        hsn_code: found.hsn_code || '',
        rate: parseFloat(found.selling_price) || 0,
        unit_id: found.unit_id,
        gst_percentage: parseFloat(found.gst_percentage) || 0,
      });
    }
  };

  const handleChange = (field, value) => {
    const updated = { ...item, [field]: value };
    // Recalculate amounts
    const qty = parseFloat(updated.quantity) || 0;
    const rate = parseFloat(updated.rate) || 0;
    const discPct = parseFloat(updated.discount_percent) || 0;
    const gross = qty * rate;
    const discAmt = (gross * discPct) / 100;
    const taxable = gross - discAmt;
    updated.taxable_amount = taxable;
    updated.total_amount = taxable + (taxable * (parseFloat(updated.gst_percentage) || 0) / 100);
    onUpdate(index, updated);
  };

  return (
    <tr>
      <td data-label="Item">
        <select
          className="erp-select"
          style={{ minWidth: '160px', fontSize: '0.8rem' }}
          value={item.stock_item_id || ''}
          onChange={e => handleItemChange(e.target.value)}
        >
          <option value="">Select Item</option>
          {stockItems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </td>
      <td data-label="HSN">
        <input className="erp-input" style={{ width: '80px', fontSize: '0.8rem' }} value={item.hsn_code || ''} onChange={e => handleChange('hsn_code', e.target.value)} placeholder="HSN" />
      </td>
      <td data-label="Qty">
        <input className="erp-input" style={{ width: '80px', fontSize: '0.8rem' }} type="number" step="0.001" value={item.quantity || ''} onChange={e => handleChange('quantity', e.target.value)} placeholder="0" min="0" />
      </td>
      <td data-label="Unit">
        <select className="erp-select" style={{ width: '70px', fontSize: '0.8rem' }} value={item.unit_id || ''} onChange={e => handleChange('unit_id', e.target.value)}>
          <option value="">Unit</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.symbol}</option>)}
        </select>
      </td>
      <td data-label="Rate (₹)">
        <input className="erp-input" style={{ width: '90px', fontSize: '0.8rem' }} type="number" step="0.01" value={item.rate || ''} onChange={e => handleChange('rate', e.target.value)} placeholder="0.00" />
      </td>
      <td data-label="Disc %">
        <input className="erp-input" style={{ width: '60px', fontSize: '0.8rem' }} type="number" step="0.01" value={item.discount_percent || 0} onChange={e => handleChange('discount_percent', e.target.value)} placeholder="0" />
      </td>
      <td data-label="GST %">
        <select className="erp-select" style={{ width: '70px', fontSize: '0.8rem' }} value={item.gst_percentage || 0} onChange={e => handleChange('gst_percentage', e.target.value)}>
          {[0,3,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
        </select>
      </td>
      <td data-label="Taxable" style={{ textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
        ₹{(parseFloat(item.taxable_amount) || 0).toFixed(2)}
      </td>
      <td data-label="Total" style={{ textAlign: 'right', fontWeight: '700', fontSize: '0.85rem', color: '#10b981', whiteSpace: 'nowrap' }}>
        ₹{(parseFloat(item.total_amount) || 0).toFixed(2)}
      </td>
      <td data-label="Action" className="action-cell" style={{ textAlign: 'right' }}>
        <NeonSweepButton tone="danger" size="sm" onClick={() => onRemove(index)}>
          <Trash2 size={14} /> Remove
        </NeonSweepButton>
      </td>
    </tr>
  );
}

export default function VoucherForm({ voucherType = 'sales' }) {
  const navigate = useNavigate();
  const { activeCompany } = useStore();
  const isSales = voucherType === 'sales';

  const [date, setDate] = useState(today());
  const [partyId, setPartyId] = useState('');
  const [narration, setNarration] = useState('');
  const [paymentMode, setPaymentMode] = useState('credit');
  const [isInterstate, setIsInterstate] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [items, setItems] = useState([{ stock_item_id: '', item_name: '', hsn_code: '', quantity: 1, unit_id: '', rate: 0, discount_percent: 0, gst_percentage: 18, taxable_amount: 0, total_amount: 0 }]);

  const [parties, setParties] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/ledgers', { params: { type: isSales ? 'customer' : 'supplier' } }),
      api.get('/stock/items'),
      api.get('/stock/units'),
    ]).then(([pr, sr, ur]) => {
      setParties(pr.data.ledgers);
      setStockItems(sr.data.items);
      setUnits(ur.data.units);
    }).catch(() => toast.error('Failed to load data'));
  }, [isSales]);

  const updateItem = (idx, updated) => {
    setItems(prev => prev.map((it, i) => i === idx ? updated : it));
  };

  const removeItem = (idx) => {
    if (items.length === 1) { toast.error('At least one item required'); return; }
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems(prev => [...prev, { stock_item_id: '', item_name: '', hsn_code: '', quantity: 1, unit_id: '', rate: 0, discount_percent: 0, gst_percentage: 18, taxable_amount: 0, total_amount: 0 }]);
  };

  // Totals
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.rate) || 0), 0);
  const totalDiscount = items.reduce((s, i) => {
    const gross = (parseFloat(i.quantity) || 0) * (parseFloat(i.rate) || 0);
    return s + (gross * (parseFloat(i.discount_percent) || 0) / 100);
  }, 0);
  const taxable = items.reduce((s, i) => s + (parseFloat(i.taxable_amount) || 0), 0);
  const totalCgst = isInterstate ? 0 : items.reduce((s, i) => s + (parseFloat(i.taxable_amount) || 0) * (parseFloat(i.gst_percentage) || 0) / 200, 0);
  const totalSgst = isInterstate ? 0 : items.reduce((s, i) => s + (parseFloat(i.taxable_amount) || 0) * (parseFloat(i.gst_percentage) || 0) / 200, 0);
  const totalIgst = isInterstate ? items.reduce((s, i) => s + (parseFloat(i.taxable_amount) || 0) * (parseFloat(i.gst_percentage) || 0) / 100, 0) : 0;
  const totalGst = totalCgst + totalSgst + totalIgst;
  const grandTotal = taxable + totalGst;
  const balance = grandTotal - (parseFloat(paidAmount) || 0);

  const handleSave = async () => {
    if (!partyId) { toast.error(isSales ? 'Select a customer' : 'Select a supplier'); return; }
    const validItems = items.filter(i => i.stock_item_id && parseFloat(i.quantity) > 0);
    if (validItems.length === 0) { toast.error('Add at least one valid item'); return; }

    setSaving(true);
    try {
      const res = await api.post('/vouchers', {
        voucher_type: voucherType,
        voucher_date: date,
        ledger_id: partyId,
        items: validItems,
        narration,
        payment_mode: paymentMode,
        is_interstate: isInterstate,
        paid_amount: parseFloat(paidAmount) || 0,
      });
      toast.success(`${isSales ? 'Sales' : 'Purchase'} voucher created!`);
      navigate(`/vouchers/${res.data.voucher.id}/view`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">{isSales ? 'Sales Voucher' : 'Purchase Voucher'}</h1>
            <p className="page-subtitle">
              {isSales ? 'Customer bill · F8' : 'Supplier purchase · F9'} · Inventory {isSales ? 'decreases' : 'increases'} automatically
            </p>
          </div>
        </div>
      </div>

      {/* Header fields */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="erp-label">{isSales ? 'Customer' : 'Supplier'} *</label>
            <select className="erp-select" value={partyId} onChange={e => setPartyId(e.target.value)}>
              <option value="">Select {isSales ? 'Customer' : 'Supplier'}</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {parties.length === 0 && (
              <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                No {isSales ? 'customers' : 'suppliers'} found. <a href={`/ledgers/new?type=${isSales ? 'customer' : 'supplier'}`} style={{ color: 'var(--accent-blue)' }}>Create one</a>
              </p>
            )}
          </div>
          <div>
            <label className="erp-label">Voucher Date *</label>
            <input className="erp-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Payment Mode</label>
            <select className="erp-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', paddingBottom: '0.5rem' }}>
              <input type="checkbox" checked={isInterstate} onChange={e => setIsInterstate(e.target.checked)} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Interstate (IGST)</span>
            </label>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label className="erp-label">Narration</label>
            <input className="erp-input" value={narration} onChange={e => setNarration(e.target.value)} placeholder="Optional note about this voucher" />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--accent-blue)' }}>Items</div>
          <button className="btn-secondary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }} onClick={addItem}>
            <Plus size={14} /> Add Item
          </button>
        </div>
        <div className="table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Rate (₹)</th>
                <th>Disc %</th>
                <th>GST %</th>
                <th style={{ textAlign: 'right' }}>Taxable</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <LineItem key={idx} index={idx} item={item} onUpdate={updateItem} onRemove={removeItem} stockItems={stockItems} units={units} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals + Save */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--accent-blue)', marginBottom: '1rem' }}>Payment</div>
          <div>
            <label className="erp-label">Advance / Paid Now (₹)</label>
            <input className="erp-input" type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="0.00" style={{ maxWidth: '200px' }} />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label className="erp-label">Narration</label>
            <textarea className="erp-input" rows={2} value={narration} onChange={e => setNarration(e.target.value)} placeholder="Remarks..." />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', minWidth: '280px' }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--accent-blue)', marginBottom: '1rem' }}>Bill Summary</div>
          {[
            ['Subtotal', subtotal],
            ['Discount', -totalDiscount],
            ['Taxable Amount', taxable],
            isInterstate ? ['IGST', totalIgst] : null,
            !isInterstate ? ['CGST', totalCgst] : null,
            !isInterstate ? ['SGST', totalSgst] : null,
            ['Total GST', totalGst],
          ].filter(Boolean).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: '600', color: val < 0 ? '#ef4444' : 'var(--text-primary)' }}>
                ₹{Math.abs(val).toFixed(2)}
              </span>
            </div>
          ))}
          <hr className="section-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
            <span>Grand Total</span>
            <span style={{ color: '#10b981' }}>₹{grandTotal.toFixed(2)}</span>
          </div>
          {parseFloat(paidAmount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Balance Due</span>
              <span style={{ fontWeight: '700', color: balance > 0 ? '#ef4444' : '#10b981' }}>₹{balance.toFixed(2)}</span>
            </div>
          )}

          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
              <Save size={15} />
              {saving ? 'Saving...' : `Save ${isSales ? 'Sales' : 'Purchase'} Voucher`}
            </button>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
