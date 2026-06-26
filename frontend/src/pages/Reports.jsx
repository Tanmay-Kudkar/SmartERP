import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Layers, BookOpen, Package, RefreshCw, BarChart3 } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('financials');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vouchers/reports/all');
      setData(res.data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Calculate stats
  const financials = data?.financials || [];
  const salesData = financials.find(f => f.voucher_type === 'sales') || { total_grand: 0, total_taxable: 0, total_gst: 0, count: 0 };
  const purchaseData = financials.find(f => f.voucher_type === 'purchase') || { total_grand: 0, total_taxable: 0, total_gst: 0, count: 0 };

  const grossProfit = parseFloat(salesData.total_taxable) - parseFloat(purchaseData.total_taxable);
  const netTaxLiability = parseFloat(salesData.total_gst) - parseFloat(purchaseData.total_gst);

  // Calculate ledger balances
  const ledgers = (data?.ledgers || []).map(l => {
    const ob = parseFloat(l.opening_balance || 0);
    const dr = parseFloat(l.total_debit || 0);
    const cr = parseFloat(l.total_credit || 0);
    
    let bal = 0;
    let type = l.balance_type;
    
    if (l.balance_type === 'Dr') {
      bal = ob + dr - cr;
    } else {
      bal = ob + cr - dr;
    }

    if (bal < 0) {
      bal = Math.abs(bal);
      type = l.balance_type === 'Dr' ? 'Cr' : 'Dr';
    }

    return { ...l, current_balance: bal, final_type: type };
  });

  // Calculate stock summary
  const stock = data?.stock || [];
  const totalStockValuation = stock.reduce((sum, item) => sum + (parseFloat(item.current_stock) * parseFloat(item.purchase_price)), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Understand company financials, inventory valuation, and account balances</p>
        </div>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={fetchReports}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '2px' }}>
        <button 
          className={`btn-icon ${activeTab === 'financials' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'financials' ? 'var(--bg-elevated)' : 'transparent', border: 'none', color: activeTab === 'financials' ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('financials')}
        >
          <BarChart3 size={16} /> Financial Summary
        </button>
        <button 
          className={`btn-icon ${activeTab === 'ledgers' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'ledgers' ? 'var(--bg-elevated)' : 'transparent', border: 'none', color: activeTab === 'ledgers' ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('ledgers')}
        >
          <BookOpen size={16} /> Trial Balance
        </button>
        <button 
          className={`btn-icon ${activeTab === 'stock' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'stock' ? 'var(--bg-elevated)' : 'transparent', border: 'none', color: activeTab === 'stock' ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('stock')}
        >
          <Package size={16} /> Stock Valuation
        </button>
      </div>

      {/* Tab: Financials */}
      {activeTab === 'financials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-green)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Net Sales (Taxable)</span>
                <TrendingUp size={18} color="var(--accent-green)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>
                ₹{parseFloat(salesData.total_taxable).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Gross Revenue: ₹{parseFloat(salesData.total_grand).toLocaleString('en-IN')} ({salesData.count} bills)
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Net Purchases (Taxable)</span>
                <TrendingDown size={18} color="var(--accent-blue)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>
                ₹{parseFloat(purchaseData.total_taxable).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Gross Outflow: ₹{parseFloat(purchaseData.total_grand).toLocaleString('en-IN')} ({purchaseData.count} bills)
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-orange)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Gross Profit</span>
                <Layers size={18} color="var(--accent-orange)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem', color: grossProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                ₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Margin: {salesData.total_taxable > 0 ? ((grossProfit / salesData.total_taxable) * 100).toFixed(1) + '%' : '0%'}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Net GST Liability</span>
                <BarChart3 size={18} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem', color: netTaxLiability >= 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                ₹{netTaxLiability.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Output GST: ₹{parseFloat(salesData.total_gst).toLocaleString('en-IN')} | Input GST: ₹{parseFloat(purchaseData.total_gst).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Quick statement */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>Trading & Income Statement (Summary)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span>Sales Revenue (A)</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-green)' }}>₹{parseFloat(salesData.total_taxable).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span>Less: Cost of Purchase (B)</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-blue)' }}>- ₹{parseFloat(purchaseData.total_taxable).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', fontWeight: '700' }}>
                <span>Gross Trading Margin (A - B)</span>
                <span style={{ color: grossProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>₹{grossProfit.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Trial Balance */}
      {activeTab === 'ledgers' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', fontWeight: '700', fontSize: '0.9rem', color: 'var(--accent-blue)', borderBottom: '1px solid var(--border)' }}>
            Account Ledger Balances
          </div>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Ledger Name</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Debit Balance (₹)</th>
                <th style={{ textAlign: 'right' }}>Credit Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No ledgers found.</td>
                </tr>
              ) : (
                ledgers.map(l => (
                  <tr key={l.id}>
                    <td data-label="Ledger Name" style={{ fontWeight: '600' }}>{l.name}</td>
                    <td data-label="Type" style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{l.ledger_type}</td>
                    <td data-label="Debit Balance" style={{ textAlign: 'right', fontWeight: l.final_type === 'Dr' ? '600' : 'normal', color: l.final_type === 'Dr' && l.current_balance > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {l.final_type === 'Dr' && l.current_balance > 0 ? l.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </td>
                    <td data-label="Credit Balance" style={{ textAlign: 'right', fontWeight: l.final_type === 'Cr' ? '600' : 'normal', color: l.final_type === 'Cr' && l.current_balance > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {l.final_type === 'Cr' && l.current_balance > 0 ? l.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Stock Summary */}
      {activeTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Total Stock Inventory Valuation</span>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.5rem', color: 'var(--accent-purple)' }}>
              ₹{totalStockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Calculated using: Current Stock × Purchase Rate</div>
          </div>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Stock Group</th>
                  <th style={{ textAlign: 'right' }}>Current Stock</th>
                  <th style={{ textAlign: 'right' }}>Purchase Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Selling Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                {stock.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No stock items found.</td>
                  </tr>
                ) : (
                  stock.map(item => {
                    const stockVal = parseFloat(item.current_stock) * parseFloat(item.purchase_price);
                    return (
                      <tr key={item.id}>
                        <td data-label="Item Name" style={{ fontWeight: '600' }}>{item.name}</td>
                        <td data-label="Stock Group" style={{ color: 'var(--text-secondary)' }}>{item.group_name || '—'}</td>
                        <td data-label="Current Stock" style={{ textAlign: 'right', fontWeight: '600', color: parseFloat(item.current_stock) > 0 ? 'var(--text-primary)' : 'var(--accent-red)' }}>
                          {parseFloat(item.current_stock).toLocaleString()} {item.unit_symbol}
                        </td>
                        <td data-label="Purchase Price" style={{ textAlign: 'right' }}>₹{parseFloat(item.purchase_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td data-label="Selling Price" style={{ textAlign: 'right' }}>₹{parseFloat(item.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td data-label="Total Value" style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent-blue)' }}>
                          ₹{stockVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
