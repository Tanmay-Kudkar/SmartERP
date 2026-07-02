import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import useStore from '../../store/useStore';

function numToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  const [intPart, decPart] = num.toFixed(2).split('.');
  let result = convert(parseInt(intPart)) + ' Rupees';
  if (parseInt(decPart) > 0) result += ' and ' + convert(parseInt(decPart)) + ' Paise';
  return result + ' Only';
}

// Row colors cycling through soft tints
const ROW_COLORS = ['#FFFFFF', '#F0FDF4', '#FFF7ED', '#F0F9FF', '#FDF4FF'];

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useStore();
  const [voucher, setVoucher] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    api.get(`/vouchers/${id}`)
      .then(r => { setVoucher(r.data.voucher); setItems(r.data.items); })
      .catch(() => toast.error('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;
  if (!voucher) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Invoice not found</div>;

  const isSales = voucher.voucher_type === 'sales';
  const isInterstate = voucher.is_interstate;
  const grandTotal = parseFloat(voucher.grand_total);

  return (
    <div className="animate-fade-in">
      {/* Action buttons - no-print */}
      <div className="no-print" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
        <span style={{ fontWeight: '700', fontSize: '1.125rem' }}>
          {isSales ? 'GST Tax Invoice' : 'Purchase Bill'} — {voucher.voucher_number}
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn-primary" onClick={handlePrint}>
          <Printer size={15} /> Print / PDF
        </button>
      </div>

      {/* Invoice */}
      <div ref={printRef} className="invoice-container" style={{ maxWidth: '920px', margin: '0 auto', background: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', borderRadius: '16px', overflow: 'visible', fontFamily: "'Inter', 'Poppins', sans-serif", color: '#111827' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          @media print {
            @page { margin: 8mm; }
            html { font-size: 11px !important; }
            body * { 
              visibility: hidden; 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .invoice-container, .invoice-container * { visibility: visible; }
            .invoice-container { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100% !important;
              max-width: 100% !important;
              background: #fff; 
              box-shadow: none !important; 
              border-radius: 0 !important; 
            }
            .no-print { display: none !important; }
            
            /* Table scaling and pagination */
            .invoice-table-wrap { overflow: visible !important; padding: 0 0.5rem !important; }
            .invoice-print-table {
              min-width: 0 !important;
              width: 100% !important;
              page-break-inside: auto;
              table-layout: auto !important;
            }
            .invoice-print-table th,
            .invoice-print-table td {
              padding: 4px 4px !important;
              white-space: nowrap !important;
            }
            /* Allow description column to wrap so it doesn't force table too wide */
            .invoice-print-table th:nth-child(2),
            .invoice-print-table td:nth-child(2) {
              white-space: normal !important;
              word-break: break-word;
            }
            .invoice-print-table thead { display: table-header-group; }
            .invoice-print-table tr { 
              page-break-inside: avoid; 
              page-break-after: auto; 
            }
            .totals-section, .signatures-section {
              page-break-inside: avoid;
            }
          }
        `}</style>

        {/* ── HEADER ── gradient top bar + company info */}
        <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #7C3AED 100%)', borderRadius: '16px 16px 0 0', padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '14px', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.75rem' }}>
              {(voucher.company_name || activeCompany?.name || 'C')[0]}
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em', lineHeight: '1.2', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{voucher.company_name || activeCompany?.name}</div>
              {voucher.company_address && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem' }}>{voucher.company_address}</div>}
              {voucher.company_gst && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>GSTIN: <span style={{ fontWeight: '600', color: '#fff' }}>{voucher.company_gst}</span></div>}
              {voucher.company_phone && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Ph: <span style={{ fontWeight: '600', color: '#fff' }}>{voucher.company_phone}</span></div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Document Type</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', letterSpacing: '0.05em', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              {isSales ? 'TAX INVOICE' : 'PURCHASE BILL'}
            </div>
            <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '0.3rem 1rem', display: 'inline-block', fontSize: '0.85rem', color: '#fff', fontWeight: '700' }}>
              #{voucher.voucher_number}
            </div>
          </div>
        </div>

        {/* ── BILL TO / INVOICE DETAILS ── colored accent cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.75rem 2.5rem' }}>
          {/* Bill To — blue tint */}
          <div style={{ border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', borderLeft: '4px solid #2563EB' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#2563EB', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
              {isSales ? '📋 BILL TO' : '🏭 SUPPLIER'}
            </div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1E3A8A' }}>{voucher.party_name}</div>
            {voucher.party_address && <div style={{ fontSize: '0.82rem', color: '#3B82F6', marginTop: '0.3rem' }}>{voucher.party_address}</div>}
            {voucher.party_gst && <div style={{ fontSize: '0.82rem', color: '#1D4ED8', marginTop: '0.4rem' }}><span style={{ color: '#93C5FD' }}>GSTIN: </span><span style={{ fontWeight: '700' }}>{voucher.party_gst}</span></div>}
            {voucher.party_phone && <div style={{ fontSize: '0.82rem', color: '#1D4ED8', marginTop: '0.2rem' }}><span style={{ color: '#93C5FD' }}>Ph: </span><span style={{ fontWeight: '700' }}>{voucher.party_phone}</span></div>}
          </div>

          {/* Invoice Details — purple tint */}
          <div style={{ border: '1px solid #DDD6FE', padding: '1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', borderLeft: '4px solid #7C3AED' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#7C3AED', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
              📄 INVOICE DETAILS
            </div>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ color: '#8B5CF6', paddingBottom: '0.4rem', fontWeight: '500' }}>Invoice No.</td><td style={{ fontWeight: '800', textAlign: 'right', color: '#4C1D95' }}>{voucher.voucher_number}</td></tr>
                <tr><td style={{ color: '#8B5CF6', paddingBottom: '0.4rem', fontWeight: '500' }}>Date</td><td style={{ fontWeight: '700', textAlign: 'right', color: '#4C1D95' }}>{new Date(voucher.voucher_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                <tr><td style={{ color: '#8B5CF6', paddingBottom: '0.4rem', fontWeight: '500' }}>Payment</td><td style={{ fontWeight: '700', textAlign: 'right', textTransform: 'capitalize', color: '#4C1D95' }}>{voucher.payment_mode}</td></tr>
                <tr><td style={{ color: '#8B5CF6', fontWeight: '500' }}>Tax Type</td><td style={{ fontWeight: '700', textAlign: 'right', color: '#4C1D95' }}>{isInterstate ? 'IGST' : 'CGST + SGST'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <div className="invoice-table-wrap" style={{ padding: '0 1.5rem', overflowX: 'auto' }}>
          <table className="invoice-print-table" style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.82rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #1E3A8A 0%, #2563EB 60%, #7C3AED 100%)', color: 'white' }}>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: '700', whiteSpace: 'nowrap' }}>Sr</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: '700' }}>Item Description</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: '700', whiteSpace: 'nowrap' }}>HSN</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: '700', whiteSpace: 'nowrap' }}>Qty</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: '700', whiteSpace: 'nowrap' }}>Unit</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>Rate</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: '700', whiteSpace: 'nowrap' }}>Disc</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>Taxable</th>
                {isInterstate ? (
                  <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>IGST</th>
                ) : (
                  <>
                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>CGST</th>
                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>SGST</th>
                  </>
                )}
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ background: ROW_COLORS[i % ROW_COLORS.length] }}>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', color: '#6B7280', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', fontWeight: '600' }}>{i + 1}</td>
                  <td style={{ padding: '0.4rem 0.6rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #E5E7EB' }}>{item.item_name}</td>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{item.hsn_code || '—'}</span>
                  </td>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: '700', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', color: '#1D4ED8' }}>{parseFloat(item.quantity).toFixed(2)}</td>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', color: '#6B7280', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{item.unit_symbol || '—'}</td>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', fontWeight: '600', color: '#374151' }}>₹{parseFloat(item.rate).toFixed(2)}</td>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                    {parseFloat(item.discount_percent) > 0 ? (
                      <span style={{ background: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '800', border: '1px solid #FCD34D' }}>{item.discount_percent}%</span>
                    ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', fontWeight: '600', color: '#374151' }}>₹{parseFloat(item.taxable_amount).toFixed(2)}</td>
                  {isInterstate ? (
                    <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', lineHeight: '1.6' }}>
                      <div style={{ color: '#7C3AED', fontSize: '0.72rem', fontWeight: '700' }}>{parseFloat(item.igst_percent) > 0 ? `${item.igst_percent}%` : '—'}</div>
                      {parseFloat(item.igst_percent) > 0 && <div style={{ color: '#111827', fontWeight: '800' }}>₹{parseFloat(item.igst_amount).toFixed(2)}</div>}
                    </td>
                  ) : (
                    <>
                      <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', lineHeight: '1.6' }}>
                        <div style={{ color: '#7C3AED', fontSize: '0.72rem', fontWeight: '700' }}>{parseFloat(item.cgst_percent) > 0 ? `${item.cgst_percent}%` : '—'}</div>
                        {parseFloat(item.cgst_percent) > 0 && <div style={{ color: '#111827', fontWeight: '800' }}>₹{parseFloat(item.cgst_amount).toFixed(2)}</div>}
                      </td>
                      <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', lineHeight: '1.6' }}>
                        <div style={{ color: '#7C3AED', fontSize: '0.72rem', fontWeight: '700' }}>{parseFloat(item.sgst_percent) > 0 ? `${item.sgst_percent}%` : '—'}</div>
                        {parseFloat(item.sgst_percent) > 0 && <div style={{ color: '#111827', fontWeight: '800' }}>₹{parseFloat(item.sgst_amount).toFixed(2)}</div>}
                      </td>
                    </>
                  )}
                  <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '900', color: '#1E3A8A', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>₹{parseFloat(item.total_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS & NOTES ── */}
        <div className="totals-section" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', padding: '0 1.5rem', marginBottom: '2rem', pageBreakInside: 'avoid' }}>

          {/* Amount in Words — green tint */}
          <div>
            <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1px solid #86EFAC', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16A34A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>💰</span>
                <strong style={{ fontSize: '0.8rem', color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount in Words</strong>
              </div>
              <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#14532D', fontWeight: '600', lineHeight: '1.5' }}>
                {numToWords(grandTotal)}
              </div>
            </div>
            {voucher.narration && (
              <div style={{ marginTop: '1rem', background: '#FEFCE8', border: '1px solid #FDE047', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #CA8A04' }}>
                <strong style={{ fontSize: '0.8rem', color: '#92400E' }}>📝 Narration:</strong>
                <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#78350F' }}>{voucher.narration}</div>
              </div>
            )}
          </div>

          {/* Totals Card */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Breakdown rows */}
            <div style={{ padding: '1rem 1.25rem', background: '#F9FAFB' }}>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.3rem 0', color: '#6B7280', fontWeight: '500' }}>Taxable Amount</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#111827' }}>₹{parseFloat(voucher.taxable_amount).toFixed(2)}</td>
                  </tr>
                  {!isInterstate && parseFloat(voucher.cgst_amount) > 0 && (
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: '#7C3AED', fontWeight: '500' }}>CGST</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#7C3AED' }}>₹{parseFloat(voucher.cgst_amount).toFixed(2)}</td>
                    </tr>
                  )}
                  {!isInterstate && parseFloat(voucher.sgst_amount) > 0 && (
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: '#7C3AED', fontWeight: '500' }}>SGST</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#7C3AED' }}>₹{parseFloat(voucher.sgst_amount).toFixed(2)}</td>
                    </tr>
                  )}
                  {isInterstate && parseFloat(voucher.igst_amount) > 0 && (
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: '#7C3AED', fontWeight: '500' }}>IGST</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#7C3AED' }}>₹{parseFloat(voucher.igst_amount).toFixed(2)}</td>
                    </tr>
                  )}
                  {parseFloat(voucher.discount_amount) > 0 && (
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: '#DC2626', fontWeight: '500' }}>🏷️ Discount</td>
                      <td style={{ textAlign: 'right', color: '#DC2626', fontWeight: '700' }}>-₹{parseFloat(voucher.discount_amount).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand Total — blue highlight */}
            <div style={{ background: 'linear-gradient(90deg, #1E3A8A, #2563EB)', padding: '0.9rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand Total</span>
                <span style={{ fontWeight: '900', fontSize: '1.3rem', color: '#fff' }}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Paid / Balance */}
            <div style={{ padding: '0.9rem 1.25rem', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#15803D', fontWeight: '700', fontSize: '0.875rem' }}>✅ Paid</span>
                <span style={{ color: '#15803D', fontWeight: '800', fontSize: '0.9rem' }}>₹{parseFloat(voucher.paid_amount || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FEF2F2', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid #FECACA' }}>
                <span style={{ color: '#DC2626', fontWeight: '700', fontSize: '0.875rem' }}>⚠️ Balance Due</span>
                <span style={{ color: '#DC2626', fontWeight: '900', fontSize: '1rem' }}>₹{parseFloat(voucher.balance_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="signatures-section" style={{ padding: '0 1.5rem 1.5rem', pageBreakInside: 'avoid' }}>
          {/* Terms */}
          <div style={{ background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <strong style={{ fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>📜 Terms & Conditions</strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: '#64748B', lineHeight: '1.7' }}>
              <li>E. & O.E.</li>
              <li>Goods once sold will not be returned.</li>
              <li>Subject to local jurisdiction.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '55px', borderBottom: '2px dashed #CBD5E1', marginBottom: '0.6rem' }} />
              <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Customer Signature</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1E3A8A', marginBottom: '0.4rem' }}>For {voucher.company_name || activeCompany?.name}</div>
              <div style={{ height: '40px', borderBottom: '2px dashed #CBD5E1', marginBottom: '0.6rem' }} />
              <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Authorized Signature</div>
            </div>
          </div>

          {/* Footer bar */}
          <div style={{ background: 'linear-gradient(90deg, #1E3A8A, #2563EB, #7C3AED)', borderRadius: '8px', padding: '0.6rem 1.25rem', textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
            Computer Generated Invoice — Powered by <span style={{ fontWeight: '800', color: '#fff' }}>SmartERP</span>
          </div>
        </div>

      </div>
    </div>
  );
}
