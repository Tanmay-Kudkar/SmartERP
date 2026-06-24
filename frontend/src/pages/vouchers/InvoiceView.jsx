import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';
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
      <div ref={printRef} className="invoice-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .invoice-container, .invoice-container * { visibility: visible; }
            .invoice-container { position: fixed; left: 0; top: 0; width: 100%; background: #fff; }
            .no-print { display: none !important; }
          }
        `}</style>

        {/* Title */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1a1a1a', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.05em' }}>{voucher.company_name || activeCompany?.name}</div>
          {voucher.company_address && <div style={{ fontSize: '0.8rem', color: '#555' }}>{voucher.company_address}</div>}
          {voucher.company_gst && <div style={{ fontSize: '0.8rem', color: '#555' }}>GSTIN: {voucher.company_gst}</div>}
          {voucher.company_phone && <div style={{ fontSize: '0.8rem', color: '#555' }}>Ph: {voucher.company_phone}</div>}
        </div>

        {/* Invoice type header */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: '700', border: '1px solid #1a1a1a', display: 'inline-block', padding: '0.2rem 1.5rem', borderRadius: '4px' }}>
            {isSales ? 'TAX INVOICE' : 'PURCHASE BILL'}
          </div>
        </div>

        {/* Bill To / Invoice Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ border: '1px solid #ddd', padding: '0.75rem', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: '#666', marginBottom: '0.375rem' }}>
              {isSales ? 'Bill To' : 'Supplier'}
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{voucher.party_name}</div>
            {voucher.party_address && <div style={{ fontSize: '0.8rem', color: '#555' }}>{voucher.party_address}</div>}
            {voucher.party_gst && <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.25rem' }}>GSTIN: {voucher.party_gst}</div>}
            {voucher.party_phone && <div style={{ fontSize: '0.8rem', color: '#555' }}>Ph: {voucher.party_phone}</div>}
          </div>
          <div style={{ border: '1px solid #ddd', padding: '0.75rem', borderRadius: '4px' }}>
            <table style={{ width: '100%', fontSize: '0.82rem' }}>
              <tbody>
                <tr><td style={{ color: '#666', paddingBottom: '0.25rem' }}>Invoice No.</td><td style={{ fontWeight: '700', textAlign: 'right' }}>{voucher.voucher_number}</td></tr>
                <tr><td style={{ color: '#666', paddingBottom: '0.25rem' }}>Date</td><td style={{ textAlign: 'right' }}>{new Date(voucher.voucher_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                <tr><td style={{ color: '#666', paddingBottom: '0.25rem' }}>Payment</td><td style={{ textAlign: 'right', textTransform: 'capitalize' }}>{voucher.payment_mode}</td></tr>
                <tr><td style={{ color: '#666' }}>Tax Type</td><td style={{ textAlign: 'right' }}>{isInterstate ? 'IGST' : 'CGST + SGST'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Sr.</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Item Description</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center' }}>HSN</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center' }}>Qty</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center' }}>Unit</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>Rate</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>Disc.</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>Taxable</th>
              {isInterstate ? (
                <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>IGST</th>
              ) : (
                <>
                  <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>CGST</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>SGST</th>
                </>
              )}
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center', color: '#666' }}>{i + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', fontWeight: '500' }}>{item.item_name}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center', color: '#666' }}>{item.hsn_code || '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center' }}>{parseFloat(item.quantity).toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center', color: '#666' }}>{item.unit_symbol || '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>₹{parseFloat(item.rate).toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right', color: '#ef4444' }}>
                  {parseFloat(item.discount_percent) > 0 ? `${item.discount_percent}%` : '—'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>₹{parseFloat(item.taxable_amount).toFixed(2)}</td>
                {isInterstate ? (
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>
                    {parseFloat(item.igst_percent) > 0 ? `${item.igst_percent}% = ₹${parseFloat(item.igst_amount).toFixed(2)}` : '—'}
                  </td>
                ) : (
                  <>
                    <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>
                      {parseFloat(item.cgst_percent) > 0 ? `${item.cgst_percent}% = ₹${parseFloat(item.cgst_amount).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right' }}>
                      {parseFloat(item.sgst_percent) > 0 ? `${item.sgst_percent}% = ₹${parseFloat(item.sgst_amount).toFixed(2)}` : '—'}
                    </td>
                  </>
                )}
                <td style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'right', fontWeight: '700' }}>₹{parseFloat(item.total_amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#555', border: '1px solid #ddd', padding: '0.75rem', borderRadius: '4px' }}>
              <strong>Amount in words:</strong><br />
              {numToWords(grandTotal)}
            </div>
            {voucher.narration && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#555', border: '1px solid #ddd', padding: '0.75rem', borderRadius: '4px' }}>
                <strong>Narration:</strong> {voucher.narration}
              </div>
            )}
          </div>
          <div>
            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '0.25rem 0', color: '#666' }}>Taxable Amount</td><td style={{ textAlign: 'right' }}>₹{parseFloat(voucher.taxable_amount).toFixed(2)}</td></tr>
                {!isInterstate && parseFloat(voucher.cgst_amount) > 0 && <tr><td style={{ padding: '0.25rem 0', color: '#666' }}>CGST</td><td style={{ textAlign: 'right' }}>₹{parseFloat(voucher.cgst_amount).toFixed(2)}</td></tr>}
                {!isInterstate && parseFloat(voucher.sgst_amount) > 0 && <tr><td style={{ padding: '0.25rem 0', color: '#666' }}>SGST</td><td style={{ textAlign: 'right' }}>₹{parseFloat(voucher.sgst_amount).toFixed(2)}</td></tr>}
                {isInterstate && parseFloat(voucher.igst_amount) > 0 && <tr><td style={{ padding: '0.25rem 0', color: '#666' }}>IGST</td><td style={{ textAlign: 'right' }}>₹{parseFloat(voucher.igst_amount).toFixed(2)}</td></tr>}
                {parseFloat(voucher.discount_amount) > 0 && <tr><td style={{ padding: '0.25rem 0', color: '#ef4444' }}>Discount</td><td style={{ textAlign: 'right', color: '#ef4444' }}>-₹{parseFloat(voucher.discount_amount).toFixed(2)}</td></tr>}
                <tr style={{ borderTop: '2px solid #1a1a1a' }}>
                  <td style={{ padding: '0.5rem 0', fontWeight: '900', fontSize: '1rem' }}>GRAND TOTAL</td>
                  <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '1rem' }}>₹{grandTotal.toFixed(2)}</td>
                </tr>
                {parseFloat(voucher.paid_amount) > 0 && <tr><td style={{ padding: '0.25rem 0', color: '#10b981' }}>Paid</td><td style={{ textAlign: 'right', color: '#10b981' }}>₹{parseFloat(voucher.paid_amount).toFixed(2)}</td></tr>}
                {parseFloat(voucher.balance_amount) > 0 && <tr><td style={{ padding: '0.25rem 0', color: '#ef4444' }}>Balance Due</td><td style={{ textAlign: 'right', color: '#ef4444' }}>₹{parseFloat(voucher.balance_amount).toFixed(2)}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '2.5rem' }}>Terms & Conditions: E. & O.E. Goods once sold will not be returned.</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Customer Signature</div>
            <div style={{ borderTop: '1px solid #999', width: '150px', marginTop: '1rem' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '2.5rem' }}>For {voucher.company_name || activeCompany?.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Authorized Signature</div>
            <div style={{ borderTop: '1px solid #999', width: '150px', marginTop: '1rem', marginLeft: 'auto' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.7rem', color: '#999' }}>
          This is a computer generated invoice. — SmartERP
        </div>
      </div>
    </div>
  );
}
