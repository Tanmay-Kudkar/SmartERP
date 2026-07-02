import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Eye, Printer } from 'lucide-react';
import api from '../../api/client';
import useStore from '../../store/useStore';
import NeonSweepButton from '../../components/NeonSweepButton';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const today = () => new Date().toISOString().split('T')[0];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - 80 + i);

const formatNumber = (num) => Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function LineItem({ index, item, onUpdate, onRemove, stockItems, units, isSales, items }) {
  const [totalFlash, setTotalFlash] = useState(false);
  const prevTotalRef = useRef(item.total_amount);

  useEffect(() => {
    if (item.total_amount !== prevTotalRef.current) {
      setTotalFlash(true);
      const timer = setTimeout(() => setTotalFlash(false), 500);
      prevTotalRef.current = item.total_amount;
      return () => clearTimeout(timer);
    }
  }, [item.total_amount]);

  const handleItemChange = (stockItemId) => {
    // Check for duplicate
    if (stockItemId && items.some((it, i) => i !== index && String(it.stock_item_id) === String(stockItemId))) {
      toast.error('Item is already added to the voucher');
      return;
    }

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

  const displayQty = parseFloat(item.quantity) || 0;
  const displayRate = parseFloat(item.rate) || 0;
  const displayDiscPct = parseFloat(item.discount_percent) || 0;
  const displayGross = displayQty * displayRate;
  const displayDiscAmt = (displayGross * displayDiscPct) / 100;
  const displayGstPct = parseFloat(item.gst_percentage) || 0;
  const displayTaxable = parseFloat(item.taxable_amount) || 0;
  const displayGstAmt = (displayTaxable * displayGstPct) / 100;

  return (
    <>
      {/* DESKTOP VIEW: Standard Table Row */}
      <tr className="desktop-only-row" style={{ verticalAlign: 'top' }}>
        {/* ITEM SELECT */}
        <td style={{ paddingTop: '0.75rem', position: 'relative' }}>
          <CustomSelect
            searchable
            value={item.stock_item_id || ''}
            placeholder="Search Item..."
            options={stockItems.map(s => ({ 
              label: s.name, 
              value: s.id,
              render: () => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0' }}>
                  <div style={{ fontWeight: '600' }}>
                    <span>{s.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span className="select-opt-subtitle">{s.group_name || 'Stock Item'}</span>
                    <span className="select-opt-price" style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>₹{formatNumber(isSales ? s.selling_price : s.purchase_price)}</span>
                  </div>
                </div>
              )
            }))}
            onChange={(id) => handleItemChange(id)}
            onSearchChange={(val) => {
              onUpdate(index, { ...item, item_name: val, stock_item_id: '' });
            }}
            innerStyle={{ minWidth: '160px', fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
          />
        </td>

        {/* QTY STEPPER */}
        <td style={{ paddingTop: '0.75rem' }}>
          <div className="stepper-container">
            <button type="button" className="stepper-btn" onClick={() => {
              const current = parseFloat(item.quantity) || 0;
              if (current > 1) handleChange('quantity', Math.max(0, current - 1));
            }}>-</button>
            <input className="stepper-input" type="number" step="1"
              value={item.quantity === '' ? '' : item.quantity} 
              onChange={e => handleChange('quantity', e.target.value.replace(/^0+(?=\d)/, ''))} 
              onFocus={e => e.target.select()}
              onWheel={e => e.target.blur()}
              onBlur={e => { if (e.target.value === '') handleChange('quantity', 1); }}
              placeholder="1" min="1" />
            <button type="button" className="stepper-btn" onClick={() => {
              const current = parseFloat(item.quantity) || 0;
              handleChange('quantity', current + 1);
            }}>+</button>
          </div>
        </td>

        {/* RATE */}
        <td style={{ paddingTop: '0.75rem' }}>
          <input className="erp-input" style={{ width: '90px', fontSize: '0.85rem' }} type="number" step="0.01"
            value={item.rate === '' ? '' : item.rate} 
            onChange={e => handleChange('rate', e.target.value.replace(/^0+(?=\d)/, ''))} 
            onFocus={e => e.target.select()}
            onWheel={e => e.target.blur()}
            onBlur={e => { if (e.target.value === '') handleChange('rate', 0); }}
            placeholder="0.00" />
        </td>

        {/* DISC % */}
        <td style={{ paddingTop: '0.75rem' }}>
          <input className="erp-input" style={{ width: '60px', fontSize: '0.85rem' }} type="number" step="0.01"
            value={item.discount_percent === '' ? '' : item.discount_percent} 
            onChange={e => handleChange('discount_percent', e.target.value.replace(/^0+(?=\d)/, ''))} 
            onFocus={e => e.target.select()}
            onWheel={e => e.target.blur()}
            onBlur={e => { if (e.target.value === '') handleChange('discount_percent', 0); }}
            placeholder="0" />
        </td>

        {/* DISC AMT */}
        <td style={{ textAlign: 'right', fontSize: '0.85rem', color: '#f97316', paddingTop: '0.75rem', whiteSpace: 'nowrap' }}>
          {displayDiscAmt > 0 ? (
            <span style={{ fontWeight: '600' }}>- ₹{formatNumber(displayDiscAmt)}</span>
          ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
        </td>

        {/* GST % */}
        <td style={{ paddingTop: '0.75rem' }}>
          <input className="erp-input" style={{ width: '60px', fontSize: '0.85rem' }} type="number" step="0.01"
            value={item.gst_percentage === '' ? '' : item.gst_percentage} 
            onChange={e => handleChange('gst_percentage', e.target.value.replace(/^0+(?=\d)/, ''))} 
            onFocus={e => e.target.select()}
            onWheel={e => e.target.blur()}
            onBlur={e => { if (e.target.value === '') handleChange('gst_percentage', 0); }}
            placeholder="0" />
        </td>

        {/* TAXABLE */}
        <td style={{ textAlign: 'right', fontSize: '0.85rem', paddingTop: '0.75rem', whiteSpace: 'nowrap' }}>
          <span className={totalFlash ? 'flash-active' : ''} style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            ₹{formatNumber(item.taxable_amount)}
          </span>
        </td>

        {/* GST AMT */}
        <td style={{ textAlign: 'right', fontSize: '0.85rem', paddingTop: '0.75rem', whiteSpace: 'nowrap' }}>
          {displayGstAmt > 0 ? (
            <span className={`color-blue ${totalFlash ? 'flash-active' : ''}`} style={{ fontWeight: '600' }}>
              + ₹{formatNumber(displayGstAmt)}
            </span>
          ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
        </td>

        {/* TOTAL */}
        <td style={{ textAlign: 'right', fontSize: '0.85rem', whiteSpace: 'nowrap', paddingTop: '0.75rem' }}>
          <span className={`color-green ${totalFlash ? 'flash-active' : ''}`} style={{ fontWeight: '800' }}>
            ₹{formatNumber(item.total_amount)}
          </span>
        </td>

        {/* ACTION */}
        <td className="action-cell" style={{ textAlign: 'right', paddingTop: '0.75rem' }}>
          <button 
            type="button"
            className="btn-icon" 
            style={{ color: '#ef4444ff', padding: '0.4rem', border: 'none', background: 'transparent' }} 
            title="Remove row (Delete)" 
            onClick={() => onRemove(index)}
          >
            <Trash2 size={16} />
          </button>
        </td>
      </tr>

      {/* MOBILE VIEW: Premium Card Row */}
      <tr className="mobile-only-row">
        <td colSpan={10} style={{ padding: '0.5rem 0', borderBottom: 'none' }}>
          <div className="mobile-item-card">
            {/* Header: Select & Delete */}
            <div style={{ gridColumn: 'span 12', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CustomSelect
                searchable
                value={item.stock_item_id || ''}
                placeholder="Search Item..."
                options={stockItems.map(s => ({ 
                  label: s.name, 
                  value: s.id,
                  render: () => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0' }}>
                      <div style={{ fontWeight: '600' }}>
                        <span>{s.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span className="select-opt-subtitle">{s.group_name || 'Stock Item'}</span>
                        <span className="select-opt-price" style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>₹{formatNumber(isSales ? s.selling_price : s.purchase_price)}</span>
                      </div>
                    </div>
                  )
                }))}
                onChange={(id) => handleItemChange(id)}
                onSearchChange={(val) => {
                  onUpdate(index, { ...item, item_name: val, stock_item_id: '' });
                }}
                innerStyle={{ minWidth: '160px', fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
              />
              <button type="button" className="mobile-delete-btn" onClick={() => onRemove(index)} title="Remove row">
                <Trash2 size={16} />
              </button>
            </div>

            {/* Basic Details Section */}
            <div className="mobile-section-header">Basic Details</div>
            <div style={{ gridColumn: 'span 6' }}>
              <label className="erp-label">📦 Qty</label>
              <div className="stepper-container">
                <button type="button" className="stepper-btn" onClick={() => {
                  const current = parseFloat(item.quantity) || 0;
                  if (current > 1) handleChange('quantity', Math.max(0, current - 1));
                }}>-</button>
                <input className="stepper-input" type="number" step="1"
                  value={item.quantity === '' ? '' : item.quantity} 
                  onChange={e => handleChange('quantity', e.target.value.replace(/^0+(?=\d)/, ''))} 
                  onFocus={e => e.target.select()}
                  onWheel={e => e.target.blur()}
                  onBlur={e => { if (e.target.value === '') handleChange('quantity', 1); }}
                  placeholder="1" min="1" />
                <button type="button" className="stepper-btn" onClick={() => {
                  const current = parseFloat(item.quantity) || 0;
                  handleChange('quantity', current + 1);
                }}>+</button>
              </div>
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <label className="erp-label">💰 Rate (₹)</label>
              <input className="erp-input" type="number" step="0.01"
                value={item.rate === '' ? '' : item.rate} 
                onChange={e => handleChange('rate', e.target.value.replace(/^0+(?=\d)/, ''))} 
                onFocus={e => e.target.select()}
                onWheel={e => e.target.blur()}
                onBlur={e => { if (e.target.value === '') handleChange('rate', 0); }}
                placeholder="0.00" />
            </div>

            {/* Pricing Section */}
            <div className="mobile-section-header">Pricing</div>
            <div style={{ gridColumn: 'span 6' }}>
              <label className="erp-label">🏷️ Disc %</label>
              <input className="erp-input" type="number" step="0.01"
                value={item.discount_percent === '' ? '' : item.discount_percent} 
                onChange={e => handleChange('discount_percent', e.target.value.replace(/^0+(?=\d)/, ''))} 
                onFocus={e => e.target.select()}
                onWheel={e => e.target.blur()}
                onBlur={e => { if (e.target.value === '') handleChange('discount_percent', 0); }}
                placeholder="0" />
            </div>
            <div style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
              <label className="erp-label">Discount Value</label>
              {displayDiscAmt > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                  <span className="color-orange" style={{ fontWeight: '700', fontSize: '0.9rem' }}>- ₹{formatNumber(displayDiscAmt)}</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="disc-badge">🏷️ {displayDiscPct}% OFF</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Saved ₹{formatNumber(displayDiscAmt)} 🎉</span>
                  </div>
                </div>
              ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>-</span>}
            </div>

            {/* Tax Section */}
            <div className="mobile-section-header">Tax</div>
            <div style={{ gridColumn: 'span 6' }}>
              <label className="erp-label">🧾 GST %</label>
              <input className="erp-input" type="number" step="0.01"
                value={item.gst_percentage === '' ? '' : item.gst_percentage} 
                onChange={e => handleChange('gst_percentage', e.target.value.replace(/^0+(?=\d)/, ''))} 
                onFocus={e => e.target.select()}
                onWheel={e => e.target.blur()}
                onBlur={e => { if (e.target.value === '') handleChange('gst_percentage', 0); }}
                placeholder="0" />
            </div>

            {/* Summary Section Header */}
            <div className="mobile-section-header">Summary</div>

            {/* Mobile Summary Grid block styled as a unified green card */}
            <div style={{ 
              gridColumn: 'span 12', 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr auto', 
              gap: '0.5rem', 
              background: 'rgba(16, 185, 129, 0.04)', 
              border: '1.5px dashed rgba(16, 185, 129, 0.15)', 
              borderRadius: '12px', 
              padding: '0.75rem' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span className="erp-label" style={{ marginBottom: '2px', fontSize: '0.65rem' }}>Taxable</span>
                <span className={totalFlash ? 'flash-active' : ''} style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ₹{formatNumber(item.taxable_amount)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span className="erp-label" style={{ marginBottom: '2px', fontSize: '0.65rem' }}>GST</span>
                {displayGstAmt > 0 ? (
                  <span className={`color-blue ${totalFlash ? 'flash-active' : ''}`} style={{ fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    + ₹{formatNumber(displayGstAmt)}
                  </span>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>-</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', padding: '4px 8px', minWidth: 0 }}>
                <span className="erp-label" style={{ color: '#10b981', marginBottom: '2px', fontSize: '0.65rem' }}>Total</span>
                <span className={`color-green ${totalFlash ? 'flash-active' : ''}`} style={{ fontSize: '1.05rem', fontWeight: '800', whiteSpace: 'nowrap' }}>
                  ₹{formatNumber(item.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
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
  
  const effectiveDiscountPct = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
  const effectiveGstPct = taxable > 0 ? (totalGst / taxable) * 100 : 0;
  
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
            <label className="erp-label">{isSales ? 'Customer' : 'Supplier'} <span style={{ color: '#ef4444' }}>*</span></label>
            <CustomSelect
              searchable
              value={partyId}
              placeholder={`Search ${isSales ? 'customer' : 'supplier'}...`}
              options={parties.map(p => ({ label: p.name, value: p.id }))}
              onChange={(id) => {
                const found = parties.find(p => p.id === id);
                if (found) {
                  setPartyId(id);
                  setPartyName(found.name);
                }
              }}
              onSearchChange={(val) => {
                setPartyName(val);
                setPartyId('');
              }}
            />
            {parties.length === 0 && (
              <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                No {isSales ? 'customers' : 'suppliers'} found. <a href={`/ledgers/new?type=${isSales ? 'customer' : 'supplier'}`} style={{ color: 'var(--accent-blue)' }}>Create one</a>
              </p>
            )}
          </div>
          <div>
            <label className="erp-label">Voucher Date <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="custom-datepicker-wrapper">
              <DatePicker
                selected={new Date(date)}
                onChange={d => {
                  if(d) {
                    const offset = d.getTimezoneOffset();
                    const adjusted = new Date(d.getTime() - (offset*60*1000));
                    setDate(adjusted.toISOString().split('T')[0]);
                  }
                }}
                dateFormat="dd-MM-yyyy"
                className="erp-input"
                renderCustomHeader={({
                  date,
                  changeYear,
                  changeMonth,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled,
                }) => (
                  <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', alignItems: 'center' }}>
                    <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}>{'<'}</button>
                    <CustomSelect
                      value={date.getMonth()}
                      onChange={changeMonth}
                      options={MONTHS.map((m, i) => ({ label: m, value: i }))}
                      style={{ flex: 1.2, minWidth: '90px' }}
                      innerStyle={{ minHeight: '28px', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    />
                    <CustomSelect
                      value={date.getFullYear()}
                      onChange={changeYear}
                      options={YEARS.map(y => ({ label: y.toString(), value: y }))}
                      style={{ flex: 1, minWidth: '70px' }}
                      innerStyle={{ minHeight: '28px', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    />
                    <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}>{'>'}</button>
                  </div>
                )}
              />
            </div>
          </div>
          <div>
            <label className="erp-label">Payment Mode</label>
            <CustomSelect
              value={paymentMode}
              onChange={setPaymentMode}
              options={[
                { label: '⏳ Credit', value: 'credit' },
                { label: '💵 Cash', value: 'cash' },
                { label: '🏦 Bank Transfer', value: 'bank' },
                { label: '📱 UPI', value: 'upi' },
                { label: '💳 Card', value: 'card' }
              ]}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', paddingBottom: '0.5rem' }}>
              <input type="checkbox" checked={isInterstate} onChange={e => setIsInterstate(e.target.checked)} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Interstate (IGST)</span>
            </label>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label className="erp-label">Narration</label>
            <textarea 
              className="erp-input" 
              value={narration} 
              onChange={e => {
                setNarration(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }} 
              placeholder="Optional note about this voucher... (Auto-expands as you type)" 
              style={{ resize: 'none', minHeight: '80px', padding: '0.75rem', lineHeight: '1.5', overflow: 'hidden' }} 
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📦</span> Items ({items.length})
          </div>
          <button type="button" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={addItem}>
            <span>➕</span> Add Product
          </button>
        </div>
        <div className="table-wrapper" style={{ paddingBottom: '2.5rem' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>📦 Qty</th>
                <th>💰 Rate (₹)</th>
                <th>🏷️ Disc %</th>
                <th style={{ textAlign: 'right' }}>🏷️ Disc (₹)</th>
                <th>🧾 GST %</th>
                <th style={{ textAlign: 'right' }}>🧾 Taxable</th>
                <th style={{ textAlign: 'right' }}>🧾 GST (₹)</th>
                <th style={{ textAlign: 'right' }}>🟢 Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <LineItem key={idx} index={idx} item={item} onUpdate={updateItem} onRemove={removeItem} stockItems={stockItems} units={units} isSales={isSales} items={items} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals + Save */}
      <div className="voucher-totals-container">
        {/* Payment Status Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--accent-blue)', marginBottom: '1.25rem' }}>Payment Status</div>
          <div>
            <label className="erp-label">Amount Received / Paid Now (₹)</label>
            <input className="erp-input" type="number" step="0.01" min="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="0.00" style={{ maxWidth: '200px' }} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label className="erp-label">Remarks</label>
            <textarea 
              className="erp-input" 
              value={narration} 
              onChange={e => {
                setNarration(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }} 
              placeholder="Payment remarks... (Auto-expands as you type)" 
              style={{ resize: 'none', minHeight: '80px', padding: '0.75rem', lineHeight: '1.5', overflow: 'hidden' }} 
            />
          </div>
        </div>

        {/* Premium Bill Summary Card */}
        <div className="bill-summary-card" style={{ padding: '1.5rem', minWidth: '340px', position: 'sticky', top: '1.5rem' }}>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--accent-green)', marginBottom: '1.25rem' }}>🧾 Bill Summary</div>
          
          {/* Items Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>₹{formatNumber(subtotal)}</span>
          </div>

          {/* Discount (Orange) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.9rem' }}>
            <span className="color-orange" style={{ fontWeight: '600' }}>🏷️ Discount {effectiveDiscountPct > 0 ? `(${effectiveDiscountPct.toFixed(2).replace(/\.00$/, '')}%)` : ''}</span>
            <span className="color-orange" style={{ fontWeight: '700' }}>- ₹{formatNumber(totalDiscount)}</span>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '1rem 0' }} />
          
          {/* Taxes (Blue) */}
          {isInterstate ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.9rem' }}>
              <span className="color-blue" style={{ fontWeight: '600' }}>🧾 IGST {effectiveGstPct > 0 ? `(${effectiveGstPct.toFixed(2).replace(/\.00$/, '')}%)` : ''}</span>
              <span className="color-blue" style={{ fontWeight: '700' }}>₹{formatNumber(totalIgst)}</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.9rem' }}>
                <span className="color-blue" style={{ fontWeight: '600' }}>🧾 CGST {effectiveGstPct > 0 ? `(${(effectiveGstPct / 2).toFixed(2).replace(/\.00$/, '')}%)` : ''}</span>
                <span className="color-blue" style={{ fontWeight: '700' }}>₹{formatNumber(totalCgst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.9rem' }}>
                <span className="color-blue" style={{ fontWeight: '600' }}>🧾 SGST {effectiveGstPct > 0 ? `(${(effectiveGstPct / 2).toFixed(2).replace(/\.00$/, '')}%)` : ''}</span>
                <span className="color-blue" style={{ fontWeight: '700' }}>₹{formatNumber(totalSgst)}</span>
              </div>
            </>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid rgba(16, 185, 129, 0.2)', margin: '1rem 0' }} />

          {/* Totals (Green, Large font 22px) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Grand Total</span>
            <span className="color-green" style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.2' }}>₹{formatNumber(grandTotal)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Advance Paid</span>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>₹{formatNumber(paidAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(16, 185, 129, 0.15)' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Balance Due</span>
            <span style={{ fontWeight: '800', color: balance > 0 ? '#ef4444' : '#10b981' }}>₹{formatNumber(balance)}</span>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button type="button" className="btn-success" style={{ gridColumn: '1 / -1', justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : `✓ Save ${isSales ? 'Sales' : 'Purchase'} Voucher`}
            </button>
            <button type="button" className="btn-primary" style={{ justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
              Save & Print
            </button>
            <button type="button" className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => navigate(-1)}>
              Cancel (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
