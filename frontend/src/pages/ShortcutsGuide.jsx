import { useState, useEffect, useRef } from 'react';
import { 
  Search, Building2, CalendarDays, Info, Calculator, RefreshCw, ArrowLeft, 
  LogOut, LayoutDashboard, Command, FileText, List, FolderPlus, PackagePlus, 
  Scale, Receipt, Book, ShoppingCart, Truck, History, FileSpreadsheet, 
  FilePlus, Edit3, Trash2, ArrowRightLeft, FileSearch, Printer, Download, 
  Mail, UserPlus, Users, Activity, Target, Save, XCircle, MonitorPlay
} from 'lucide-react';

const SHORTCUTS_DATA = [
  {
    category: 'Global',
    shortcuts: [
      { id: 'companies', keys: ['F1'], label: 'Company Selection', desc: 'Select, switch, or create a company.', icon: Building2 },
      { id: 'f2-year', keys: ['F2'], label: 'Financial Year', desc: 'Set or change the active financial year.', icon: CalendarDays },
      { id: 'f3-info', keys: ['F3'], label: 'Company Info', desc: 'Open the active company management screen.', icon: Info },
      { id: 'f4-calc', keys: ['F4'], label: 'Calculator', desc: 'Toggle the interactive floating calculator.', icon: Calculator },
      { id: 'f5-refresh', keys: ['F5'], label: 'Refresh Data', desc: 'Force reload the active page and data.', icon: RefreshCw },
      { id: 'goback', keys: ['Esc'], label: 'Previous Screen', desc: 'Go back to the previous view.', icon: ArrowLeft },
      { id: 'logout', keys: ['Ctrl', 'Q'], label: 'Logout Session', desc: 'Securely log out of the application.', icon: LogOut },
      { id: 'dashboard', keys: ['Ctrl', 'H'], label: 'Gateway of ERP', desc: 'Return to the main Dashboard.', icon: LayoutDashboard },
      { id: 'cmd-search', keys: ['Ctrl', 'K'], label: 'Command Search', desc: 'Access global command palette search.', icon: Command },
    ]
  },
  {
    category: 'Masters',
    shortcuts: [
      { id: 'ledger-new', keys: ['Alt', 'L'], label: 'Create Ledger', desc: 'Open ledger creation form.', icon: FileText },
      { id: 'ledgers-list', keys: ['Alt', 'A'], label: 'Alter Ledger', desc: 'List all ledgers for modifying or viewing.', icon: List },
      { id: 'group-new', keys: ['Alt', 'G'], label: 'Create Group', desc: 'Create a new ledger group.', icon: FolderPlus },
      { id: 'stock-new', keys: ['Alt', 'S'], label: 'Create Stock Item', desc: 'Open stock item creation form.', icon: PackagePlus },
      { id: 'units', keys: ['Alt', 'U'], label: 'Unit Creation', desc: 'Manage units of measure.', icon: Scale },
    ]
  },
  {
    category: 'Vouchers',
    shortcuts: [
      { id: 'v-receipt', keys: ['F6'], label: 'Receipt', desc: 'Create a Receipt Voucher.', icon: Receipt },
      { id: 'v-journal', keys: ['F7'], label: 'Journal', desc: 'Create a Journal Voucher.', icon: Book },
      { id: 'sales', keys: ['F8'], label: 'Sales Voucher', desc: 'Open Sales voucher invoice creator.', icon: ShoppingCart },
      { id: 'purchase', keys: ['F9'], label: 'Purchase Voucher', desc: 'Open Purchase voucher entry form.', icon: Truck },
      { id: 'v-reversing', keys: ['F10'], label: 'Reversing Journal', desc: 'Create a reversing journal.', icon: History },
      { id: 'vouchers', keys: ['Ctrl', 'V'], label: 'Register', desc: 'Open register listing all vouchers.', icon: FileSpreadsheet },
    ]
  },
  {
    category: 'Inventory',
    shortcuts: [
      { id: 'stock-list', keys: ['Ctrl', 'I'], label: 'Inventory Dashboard', desc: 'List all stock items & levels.', icon: LayoutDashboard },
      { id: 'item-new', keys: ['Ctrl', 'N'], label: 'New Stock Item', desc: 'Create a new stock item directly.', icon: FilePlus },
      { id: 'item-edit', keys: ['Ctrl', 'E'], label: 'Edit Active Item', desc: 'Edit the highlighted row item.', icon: Edit3, contextual: true },
      { id: 'item-delete', keys: ['Ctrl', 'D'], label: 'Delete Item', desc: 'Delete the highlighted row item.', icon: Trash2, contextual: true },
      { id: 'stock-transfer', keys: ['Ctrl', 'T'], label: 'Stock Transfer', desc: 'Transfer stock between locations.', icon: ArrowRightLeft },
      { id: 'stock-report', keys: ['Ctrl', 'R'], label: 'Stock Report', desc: 'View stock summary & valuation.', icon: FileSearch },
    ]
  },
  {
    category: 'Billing',
    shortcuts: [
      { id: 'billing-new', keys: ['Ctrl', 'B'], label: 'New Invoice', desc: 'Quick-start a new Sales Invoice.', icon: FilePlus },
      { id: 'print', keys: ['Ctrl', 'P'], label: 'Print Invoice', desc: 'Print active screen or GST Invoice.', icon: Printer, contextual: true },
      { id: 'pdf-download', keys: ['Ctrl', 'Shift', 'P'], label: 'PDF Download', desc: 'Download GST Invoice as PDF.', icon: Download, contextual: true },
      { id: 'email-invoice', keys: ['Ctrl', 'M'], label: 'Email Invoice', desc: 'Send GST Invoice directly via email.', icon: Mail, contextual: true },
    ]
  },
  {
    category: 'Parties',
    shortcuts: [
      { id: 'customer-new', keys: ['Ctrl', 'C'], label: 'New Customer', desc: 'Add a new Customer ledger.', icon: UserPlus },
      { id: 'customer-list', keys: ['Ctrl', 'Shift', 'C'], label: 'Customer List', desc: 'View Customer accounts list.', icon: Users },
      { id: 'supplier-new', keys: ['Ctrl', 'S'], label: 'New Supplier', desc: 'Add a new Supplier ledger.', icon: UserPlus },
      { id: 'supplier-list', keys: ['Ctrl', 'Shift', 'S'], label: 'Supplier List', desc: 'View Supplier accounts list.', icon: Users },
    ]
  },
  {
    category: 'Reports',
    shortcuts: [
      { id: 'rep-balance', keys: ['Alt', 'B'], label: 'Balance Sheet', desc: 'Open Balance Sheet reports.', icon: Scale },
      { id: 'rep-pl', keys: ['Alt', 'P'], label: 'Profit & Loss', desc: 'Open Profit & Loss reports.', icon: Activity },
      { id: 'rep-trial', keys: ['Alt', 'T'], label: 'Trial Balance', desc: 'Open Trial Balance (Ledgers).', icon: List },
      { id: 'rep-cash', keys: ['Alt', 'C'], label: 'Cash Flow', desc: 'Open Cash Flow statement.', icon: ArrowRightLeft },
      { id: 'rep-stock', keys: ['Alt', 'R'], label: 'Stock Summary', desc: 'Open Stock Valuation report.', icon: PackagePlus },
      { id: 'rep-gst', keys: ['Alt', 'X'], label: 'GST Report', desc: 'Open GST tax liability report.', icon: Target },
    ]
  },
  {
    category: 'Navigation',
    shortcuts: [
      { id: 'search-focus', keys: ['Ctrl', 'F'], label: 'Search Page', desc: 'Focus the search box on active page.', icon: Search, contextual: true },
      { id: 'global-search', keys: ['Ctrl', 'Shift', 'F'], label: 'Global Search', desc: 'Search across the entire ERP.', icon: Search },
      { id: 'nav-arrows', keys: ['Arrows'], label: 'Table Navigation', desc: 'Navigate between rows on any table.', icon: ArrowRightLeft, contextual: true },
      { id: 'nav-select', keys: ['Enter'], label: 'Select Row', desc: 'Open or edit the highlighted item.', icon: MonitorPlay, contextual: true },
      { id: 'form-save', keys: ['Ctrl', 'Enter'], label: 'Save Form', desc: 'Submit and save forms instantly.', icon: Save, contextual: true },
      { id: 'form-cancel', keys: ['Alt', 'C'], label: 'Cancel Changes', desc: 'Discard changes and return to list.', icon: XCircle, contextual: true },
    ]
  }
];

const FREQUENTLY_USED = ['companies', 'sales', 'purchase', 'f4-calc', 'dashboard', 'cmd-search'];

export default function ShortcutsGuide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const searchInputRef = useRef(null);

  // Focus search on Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter shortcuts
  const allCategories = ['All', 'Frequently Used', ...SHORTCUTS_DATA.map(c => c.category)];

  let dataToRender = [];

  if (activeCategory === 'Frequently Used') {
    const freq = [];
    SHORTCUTS_DATA.forEach(cat => {
      cat.shortcuts.forEach(sc => {
        if (FREQUENTLY_USED.includes(sc.id)) freq.push(sc);
      });
    });
    dataToRender = [{ category: 'Frequently Used', shortcuts: freq }];
  } else {
    dataToRender = SHORTCUTS_DATA.filter(cat => activeCategory === 'All' || cat.category === activeCategory)
      .map(cat => {
        const matched = cat.shortcuts.filter(sc => 
          sc.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sc.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sc.keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        return { ...cat, shortcuts: matched };
      }).filter(cat => cat.shortcuts.length > 0);
  }

  // Count total
  const totalShortcuts = SHORTCUTS_DATA.reduce((acc, cat) => acc + cat.shortcuts.length, 0);

  const handleShortcutClick = (sc) => {
    if (sc.keys.includes('Arrows')) return;
    
    let keyToDispatch = sc.keys[sc.keys.length - 1]; 
    let ctrlKey = sc.keys.includes('Ctrl');
    let altKey = sc.keys.includes('Alt');
    let shiftKey = sc.keys.includes('Shift');
    
    if (keyToDispatch === 'Enter') keyToDispatch = 'Enter';
    else if (keyToDispatch === 'Esc') keyToDispatch = 'Escape';
    else if (keyToDispatch.length === 1) keyToDispatch = keyToDispatch.toLowerCase();
    
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: keyToDispatch,
      ctrlKey,
      altKey,
      shiftKey,
      bubbles: true,
      cancelable: true
    }));
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .shortcut-card-contextual {
          border: 1px solid var(--border-subtle);
        }
        .shortcut-card-modern {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease;
          border: 1px solid var(--border-subtle);
        }
        .shortcut-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
          border-color: var(--accent-blue);
        }
        .filter-pill {
          padding: 0.35rem 1rem;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .filter-pill.active {
          background: var(--accent-blue);
          color: #fff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .filter-pill.inactive {
          background: var(--bg-card);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .filter-pill.inactive:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }
        .shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.25rem;
        }
      `}} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0, maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 0.5rem' }}>
        
        {/* Header Section */}
        <div style={{ flexShrink: 0, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                ⌨ Keyboard Shortcuts
              </h1>
              <p className="page-subtitle">Master SmartERP with lightning-fast navigation.</p>
              
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div className="stat-chip">
                  <span style={{ color: '#10b981' }}>🟢</span> {totalShortcuts} Shortcuts
                </div>
                <div className="stat-chip">
                  <span>⚡</span> Tally Style
                </div>
                <div className="stat-chip">
                  <span>🧮</span> Calculator
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', width: '320px', maxWidth: '100%', alignSelf: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                ref={searchInputRef}
                className="erp-input shadow-sm" 
                style={{ paddingLeft: '2.75rem', paddingRight: '4.5rem', height: '44px', fontSize: '0.95rem' }} 
                placeholder="Try: F8, Calculator..." 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (activeCategory !== 'All' && e.target.value) setActiveCategory('All');
                }}
              />
              <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px' }}>
                <kbd className="kbd" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', minWidth: 'auto', background: 'var(--bg-card)' }}>Ctrl</kbd>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>+</span>
                <kbd className="kbd" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', minWidth: 'auto', background: 'var(--bg-card)' }}>/</kbd>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
            {allCategories.map(cat => (
              <button
                key={cat}
                className={`filter-pill ${activeCategory === cat ? 'active' : 'inactive'}`}
                onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
              >
                {cat === 'Frequently Used' ? '⭐ ' : ''}{cat}
              </button>
            ))}
          </div>

        </div>

        {/* Grid Section */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '2rem' }}>
          {dataToRender.length === 0 ? (
            <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matching shortcuts found. Press <strong>Esc</strong> to clear search.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {dataToRender.map(cat => (
                <div key={cat.category}>
                  {activeCategory === 'All' && (
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                      {cat.category}
                    </h3>
                  )}
                  
                  <div className="shortcuts-grid">
                    {cat.shortcuts.map(sc => (
                      <div 
                        id={`shortcut-${sc.id}`}
                        key={sc.id}
                        className={`glass-card ${sc.contextual ? 'shortcut-card-contextual' : 'shortcut-card-modern'}`}
                        onClick={sc.contextual ? undefined : () => handleShortcutClick(sc)}
                        style={{ 
                          padding: '1.25rem', 
                          display: 'flex', 
                          flexDirection: 'column',
                          height: '220px',
                          background: 'var(--card-glass-bg)',
                          position: 'relative',
                          cursor: sc.contextual ? 'default' : 'pointer',
                          opacity: sc.contextual ? 0.8 : 1
                        }}
                      >
                        {/* Top: Large Key */}
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {sc.keys.map((k, idx) => (
                            <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <kbd className="kbd" style={{ fontSize: '1rem', padding: '0.35rem 0.6rem', minWidth: '36px', textAlign: 'center' }}>{k}</kbd>
                              {idx < sc.keys.length - 1 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>+</span>}
                            </span>
                          ))}
                        </div>

                        {/* Middle: Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '1.1rem', lineHeight: '1.3', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {sc.icon && <sc.icon size={18} color="var(--accent-blue)" style={{ flexShrink: 0 }} />}
                            {sc.label}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {sc.desc}
                          </div>
                        </div>

                        {/* Bottom: Badge */}
                        <div style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--bg-primary)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                            {cat.category === 'Frequently Used' ? 'Global' : cat.category}
                          </span>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div style={{ flexShrink: 0, padding: '1rem 0 0.5rem 0', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>💡</span> 
            <strong>Tip:</strong> Press <kbd className="kbd" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', minWidth: 'auto', background: 'var(--bg-card)' }}>Ctrl</kbd> <span style={{ color: 'var(--text-muted)' }}>+</span> <kbd className="kbd" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', minWidth: 'auto', background: 'var(--bg-card)' }}>K</kbd> anywhere to search commands instantly.
          </div>
        </div>
      </div>
    </div>
  );
}
