import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Eye, Printer } from 'lucide-react';
import api from '../../api/client';
import useStore from '../../store/useStore';
import NeonSweepButton from '../../components/NeonSweepButton';

const today = () => new Date().toISOString().split('T')[0];

const formatNumber = (num) => Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function LineItem({ index, item, onUpdate, onRemove, stockItems, units, isSales }) {
  const handleItemChange = (stockItemId) => {
    const found = stockItems.find(s => String(s.id) === String(stockItemId));
    if (found) {
      const rate = isSales
        ? (parseFloat(found.selling_price) || 0)
        : (parseFloat(found.purchase_price) || 0);
      const qty      = parseFloat(item.quantity) || 1;
      const discPct  = parseFloat(item.discount_percent) || 0;
      const gross    = qty * rate;
      const discAmt  = (gross * discPct) / 100;
      const taxable  = gross - discAmt;
      const gstPct   = parseFloat(found.gst_percentage) || 0;
      const unitSym  = units.find(u => String(u.id) === String(found.unit_id))?.symbol || '';
      onUpdate(index, {
        ...item,
        stock_item_id:  found.id,
        item_name:      found.name,
        hsn_code:       found.hsn_code || '',
        rate,
        unit_id:        found.unit_id,
        unit_symbol:    unitSym,
        gst_percentage: gstPct,
        taxable_amount: taxable,
        total_amount:   taxable + (taxable * gstPct / 100),
      });
    } else {
      onUpdate(index, { ...item, stock_item_id: '', item_name: '', hsn_code: '', rate: 0, unit_id: '', unit_symbol: '', gst_percentage: 0, taxable_amount: 0, total_amount: 0 });
    }
  };

  const handleChange = (field, value) => {
    const updated  = { ...item, [field]: value };
    const qty      = parseFloat(updated.quantity) || 0;
    const rate     = parseFloat(updated.rate) || 0;
    const discPct  = parseFloat(updated.discount_percent) || 0;
    const gross    = qty * rate;
    const discAmt  = (gross * discPct) / 100;
    const taxable  = gross - discAmt;
    updated.taxable_amount = taxable;
    updated.total_amount   = taxable + (taxable * (parseFloat(updated.gst_percentage) || 0) / 100);
    onUpdate(index, updated);
  };

  // resolve unit symbol (may come from auto-fill or lookup)
  const unitSymbol = item.unit_symbol || units.find(u => String(u.id) === String(item.unit_id))?.symbol || '';

  return (
    <tr style={{ verticalAlign: 'top' }}>
      {/* ITEM — auto-fills all metadata on change */}
      <td data-label="Item" style={{ paddingTop: '0.75rem', position: 'relative' }} className="item-cell-hover">
        <input
          className="erp-input"
          list={`item-list-${index}`}
          placeholder="Search Item..."
          style={{ minWidth: '160px', fontSize: '0.8rem' }}
          value={item.item_name || ''}
          onChange={e => {
            const val = e.target.value;
            const found = stockItems.find(s => s.name === val);
            if (found) {
              handleItemChange(found.id);
            } else {
              onUpdate(index, { ...item, item_name: val, stock_item_id: '' });
            }
          }}
          onFocus={e => e.target.select()}
        />
        <datalist id={`item-list-${index}`}>
          {stockItems.map(s => <option key={s.id} value={s.name} />)}
        </datalist>
        {/* Read-only info shown as tooltip on hover */}
        {item.stock_item_id && (
          <div className="hover-badges" style={{
            position: 'absolute',
            top: '3.2rem',
            left: '0.75rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '0.4rem 0.6rem',
            borderRadius: '6px',
            display: 'flex',
            gap: '0.4rem',
            zIndex: 100,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s',
          }}>
            {item.hsn_code    && <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', borderRadius: '4px', padding: '2px 6px', fontSize: '0.68rem', fontWeight: '600' }}>HSN: {item.hsn_code}</span>}
            {unitSymbol       && <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', borderRadius: '4px', padding: '2px 6px', fontSize: '0.68rem', fontWeight: '600' }}>{unitSymbol}</span>}
            {item.gst_percentage > 0 && <span style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', borderRadius: '4px', padding: '2px 6px', fontSize: '0.68rem', fontWeight: '600' }}>GST {item.gst_percentage}%</span>}
          </div>
        )}
      </td>

      {/* QTY */}
      <td data-label="Qty" style={{ paddingTop: '0.75rem' }}>
        <input className="erp-input" style={{ width: '80px', fontSize: '0.8rem' }} type="number" step="0.001"
          value={item.quantity || ''} onChange={e => handleChange('quantity', e.target.value)} placeholder="0" min="0" />
      </td>

      {/* RATE — pre-filled but editable */}
      <td data-label="Rate (₹)" style={{ paddingTop: '0.75rem' }}>
        <input className="erp-input" style={{ width: '100px', fontSize: '0.8rem' }} type="number" step="0.01"
          value={item.rate || ''} onChange={e => handleChange('rate', e.target.value)} placeholder="0.00" />
      </td>

      {/* DISC % */}
      <td data-label="Disc %" style={{ paddingTop: '0.75rem' }}>
        <input className="erp-input" style={{ width: '60px', fontSize: '0.8rem' }} type="number" step="0.01"
          value={item.discount_percent || 0} onChange={e => handleChange('discount_percent', e.target.value)} placeholder="0" />
      </td>

      {/* TAXABLE */}
      <td data-label="Taxable" style={{ textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', paddingTop: '0.75rem' }}>
        ₹{formatNumber(item.taxable_amount)}
      </td>

      {/* TOTAL */}
      <td data-label="Total" style={{ textAlign: 'right', fontWeight: '700', fontSize: '0.85rem', color: '#10b981', whiteSpace: 'nowrap', paddingTop: '0.75rem' }}>
        ₹{formatNumber(item.total_amount)}
      </td>

      {/* ACTION */}
      <td data-label="Action" className="action-cell" style={{ textAlign: 'right', paddingTop: '0.75rem' }}>
        <button 
          className="btn-icon" 
          style={{ color: '#ef4444', padding: '0.4rem', border: 'none', background: 'transparent' }} 
          title="Remove row (Delete)" 
          onClick={() => onRemove(index)}
        >
          <Trash2 size={16} />
        </button>
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
  const [partyName, setPartyName] = useState('');
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

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
      // Mock INV number from response id
      const invNum = `INV-${new Date().getFullYear()}-${String(res.data.voucher.id).padStart(5, '0')}`;
      toast.success(`✓ ${isSales ? 'Sales' : 'Purchase'} Voucher Saved (${invNum})`);
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
              {isSales ? 'Customer bill · Draft' : 'Supplier purchase · Draft'} · Created Today
            </p>
          </div>
        </div>
      </div>

      {/* Header fields */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="erp-label">{isSales ? 'Customer' : 'Supplier'} *</label>
            <input
              className="erp-input"
              list="party-list"
              placeholder={`Search ${isSales ? 'customer' : 'supplier'}...`}
              value={partyName}
              onChange={e => {
                const val = e.target.value;
                setPartyName(val);
                const found = parties.find(p => p.name === val);
                if (found) setPartyId(found.id);
                else setPartyId('');
              }}
              onFocus={e => e.target.select()}
            />
            <datalist id="party-list">
              {parties.map(p => <option key={p.id} value={p.name} />)}
            </datalist>
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
              <option value="credit">⏳ Credit</option>
              <option value="cash">💵 Cash</option>
              <option value="bank">🏦 Bank Transfer</option>
              <option value="upi">📱 UPI</option>
              <option value="card">💳 Card</option>
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
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--accent-blue)' }}>Items</div>
          <button className="btn-secondary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }} onClick={addItem}>
            <Plus size={14} /> Add Item
          </button>
        </div>
        <div className="table-wrapper" style={{ paddingBottom: '2.5rem' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate (₹)</th>
                <th>Disc %</th>
                <th style={{ textAlign: 'right' }}>Taxable</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <LineItem key={idx} index={idx} item={item} onUpdate={updateItem} onRemove={removeItem} stockItems={stockItems} units={units} isSales={isSales} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals + Save */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'start' }}>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--accent-blue)', marginBottom: '1rem' }}>Payment Status</div>
          <div>
            <label className="erp-label">Amount Received / Paid Now (₹)</label>
            <input className="erp-input" type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="0.00" style={{ maxWidth: '200px' }} />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label className="erp-label">Remarks</label>
            <input className="erp-input" value={narration} onChange={e => setNarration(e.target.value)} placeholder="Payment remarks..." />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.2rem', minWidth: '320px', position: 'sticky', top: '1.5rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--accent-blue)', marginBottom: '1rem' }}>Bill Summary</div>
          
          {/* Items Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{formatNumber(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
            <span style={{ fontWeight: '600', color: '#ef4444' }}>- ₹{formatNumber(totalDiscount)}</span>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '0.75rem 0' }} />
          
          {/* Taxes */}
          {isInterstate ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>IGST</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{formatNumber(totalIgst)}</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>CGST</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{formatNumber(totalCgst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SGST</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{formatNumber(totalSgst)}</span>
              </div>
            </>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '0.75rem 0' }} />

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>
            <span>Grand Total</span>
            <span style={{ color: '#10b981' }}>₹{formatNumber(grandTotal)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Advance</span>
            <span style={{ fontWeight: '600' }}>₹{formatNumber(paidAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Balance Due</span>
            <span style={{ fontWeight: '700', color: balance > 0 ? '#ef4444' : '#10b981' }}>₹{formatNumber(balance)}</span>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button className="btn-success" style={{ gridColumn: '1 / -1', justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : `✓ Save ${isSales ? 'Sales' : 'Purchase'} Voucher`}
            </button>
            <button className="btn-primary" style={{ justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
              Save & Print
            </button>
            <button className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => navigate(-1)}>
              Cancel (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
