import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Keyboard, FileSpreadsheet, Boxes, Layers, ArrowRight, CheckCircle, Sun, Moon, Star, Quote, Check, ChevronDown, ChevronUp } from 'lucide-react';
import useStore from '../store/useStore';
import NeonSweepButton from '../components/NeonSweepButton';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const { theme, setTheme } = useStore();

  const [openFaq, setOpenFaq] = useState(null);

  // Animation states for Dashboard Mockup
  const [revenue, setRevenue] = useState(0);
  const [vouchers, setVouchers] = useState([
    { id: 'SAL-2026-0032', name: 'Acme Corporation',  amt: '₹ 14,350.00', cls: 'lp-voucher-amt-green' },
    { id: 'PUR-2026-0012', name: 'Matrix Logistics',  amt: '₹ 42,900.00', cls: 'lp-voucher-amt-red'   },
    { id: 'SAL-2026-0031', name: 'Zenith Tech Inc',   amt: '₹ 8,920.00',  cls: 'lp-voucher-amt-green' },
  ]);

  // CountUp Effect
  useEffect(() => {
    let start = 0;
    const end = 245890;
    const duration = 1500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setRevenue(end);
        clearInterval(timer);
      } else {
        setRevenue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  // Live Feed Effect
  useEffect(() => {
    const newVouchers = [
      { id: 'SAL-2026-0033', name: 'TechNova Solutions', amt: '₹ 21,400.00', cls: 'lp-voucher-amt-green' },
      { id: 'PUR-2026-0013', name: 'Global Supplies', amt: '₹ 12,000.00', cls: 'lp-voucher-amt-red' },
      { id: 'SAL-2026-0034', name: 'Apex Industries', amt: '₹ 5,600.00', cls: 'lp-voucher-amt-green' },
    ];
    let i = 0;
    const timer = setInterval(() => {
      setVouchers(prev => {
        const next = [newVouchers[i % newVouchers.length], ...prev.slice(0, 2)];
        next[0].isNew = true; // flag to trigger animation if needed
        return next;
      });
      i++;
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Keyboard style={{ width: '2.25rem', height: '2.25rem', color: '#3b82f6' }} />,
      title: 'Keyboard-First Workflow',
      desc: 'Inspired by Tally. Complete actions, record vouchers, and navigate the entire system using rapid keyboard shortcuts (F8, F9, Alt+L, Esc).',
      color: '#3b82f6',
    },
    {
      icon: <FileSpreadsheet style={{ width: '2.25rem', height: '2.25rem', color: '#8b5cf6' }} />,
      title: 'GST-Compliant Invoicing',
      desc: 'Instant CGST, SGST, and IGST calculations. Generate beautiful, professional, and compliant A4 tax invoices ready to download or print.',
      color: '#8b5cf6',
    },
    {
      icon: <Boxes style={{ width: '2.25rem', height: '2.25rem', color: '#10b981' }} />,
      title: 'Live Inventory Tracking',
      desc: 'Auto-updating stock counts as you record sales or purchase vouchers. Manage items, pricing, custom units, and reorder alerts.',
      color: '#10b981',
    },
    {
      icon: <Layers style={{ width: '2.25rem', height: '2.25rem', color: '#f59e0b' }} />,
      title: 'Multi-Company Control',
      desc: 'Create and switch between up to 5 different companies on a single account. Perfect for managing multiple firms or entities.',
      color: '#f59e0b',
    },
  ];

  const shortcuts = [
    { key: 'F1',      desc: 'Select Company'   },
    { key: 'F8',      desc: 'Sales Voucher'    },
    { key: 'F9',      desc: 'Purchase Voucher' },
    { key: 'Alt + L', desc: 'Create Ledger'   },
    { key: 'Alt + S', desc: 'Create Stock'    },
    { key: 'Esc',     desc: 'Go Back'         },
  ];

  return (
    <div className="lp-root">
      {/* Background glows */}
      <div className="lp-glow lp-glow-1" />
      <div className="lp-glow lp-glow-2" />

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => navigate('/')}>
            <div className="lp-logo-icon">
              <Zap style={{ width: '1.5rem', height: '1.5rem', fill: 'currentColor' }} />
            </div>
            <span className="lp-logo-text">SmartERP</span>
          </div>
          <div className="lp-nav-actions">
            <span className="lp-nav-link" onClick={() => {}}>Features</span>
            <span className="lp-nav-link" onClick={() => {}}>Pricing</span>
            <span className="lp-nav-link" onClick={() => {}}>Docs</span>
            <span className="lp-nav-link" onClick={() => {}}>About</span>
            <button
              className="lp-btn-theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <NeonSweepButton tone="primary" onClick={() => navigate('/register')}>Get Started Free</NeonSweepButton>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <header className="lp-hero">
        <div className="lp-badge">
          <Zap style={{ width: '0.875rem', height: '0.875rem' }} />
          Next-Gen Cloud ERP
        </div>

        <h1 className="lp-hero-title">
          Modern Accounting at the{' '}
          <span className="lp-hero-title-gradient">Speed of Thought</span>
        </h1>

        <p className="lp-hero-desc">
          A lightning-fast, keyboard-first business system inspired by Tally. Seamlessly
          manage invoicing, real-time inventory, tax compliance, and finance.
        </p>

        <div className="lp-hero-ctas">
          <NeonSweepButton tone="primary" size="lg" onClick={() => navigate('/register')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Start Free Trial
              <ArrowRight style={{ width: '1.25rem', height: '1.25rem' }} />
            </span>
          </NeonSweepButton>
          <NeonSweepButton tone="slate" size="lg" onClick={() => navigate('/login')}>
            Demo Login
          </NeonSweepButton>
        </div>

        <div className="lp-trust-bar">
          <div className="lp-trust-stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="currentColor" />
            ))}
          </div>
          <div className="lp-trust-text">Loved by 5,000+ fast-growing businesses</div>
        </div>

        {/* Mock UI Showcase */}
        <div className="lp-mockup-wrap">
          <div className="lp-mockup-chrome">
            <div className="lp-mockup-bar">
              <div className="lp-mockup-dots">
                <span className="lp-dot lp-dot-red" />
                <span className="lp-dot lp-dot-amber" />
                <span className="lp-dot lp-dot-green" />
              </div>
              <span className="lp-mockup-label">SmartERP Dashboard</span>
              <div style={{ width: '3rem' }} />
            </div>

            <div className="lp-mockup-body">
              {/* Stat cards */}
              <div className="lp-stat-cards">
                <div className="lp-stat-card">
                  <div className="lp-stat-label">Total Net Sales</div>
                  <div className="lp-stat-value">₹ {revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="lp-stat-sub lp-stat-green">↑ 12.4% this month</div>
                </div>
                <div className="lp-stat-card">
                  <div className="lp-stat-label">Inventory Status</div>
                  <div className="lp-stat-value">2,410 Units</div>
                  <div className="lp-stat-sub lp-stat-blue">4 items low stock</div>
                </div>
                <div className="lp-stat-card">
                  <div className="lp-stat-label">Active Companies</div>
                  <div className="lp-stat-value">3 Accounts</div>
                  <div className="lp-stat-sub lp-stat-muted">Max 5 companies limit</div>
                </div>
              </div>

              {/* Voucher panel */}
              <div className="lp-voucher-panel">
                <div className="lp-voucher-header">
                  <span className="lp-voucher-title">Recent Vouchers</span>
                  <span className="lp-live-badge">Live Feed</span>
                </div>
                <div className="lp-voucher-list">
                  {vouchers.map(v => (
                    <div key={v.id} className={`lp-voucher-row ${v.isNew ? 'lp-voucher-row-entering' : ''}`}>
                      <span className="lp-voucher-id">{v.id}</span>
                      <span className="lp-voucher-name">{v.name}</span>
                      <span className={v.cls}>{v.amt}</span>
                    </div>
                  ))}
                </div>
                <div className="lp-voucher-footer">
                  <span>Press <kbd className="lp-kbd">F8</kbd> to record a sale</span>
                  <span className="lp-voucher-link">
                    View Vouchers <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Features ───────────────────────────────── */}
      <section className="lp-features">
        <div className="lp-container">
          <div className="lp-features-header">
            <h2 className="lp-section-title">Everything You Need, Built for Efficiency</h2>
            <p className="lp-section-subtitle">
              SmartERP combines clean interfaces with traditional accounting speed to deliver
              the ultimate workflow.
            </p>
          </div>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div key={i} className="lp-feature-card" style={{ '--feature-color': f.color }}>
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-name">{f.title}</div>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Keyboard ───────────────────────────────── */}
      <section className="lp-keyboard">
        <div className="lp-container">
          <div className="lp-keyboard-inner">
            <div className="lp-keyboard-text">
              <h2 className="lp-keyboard-title">Lightning Fast Keyboard Navigation</h2>
              <p className="lp-keyboard-desc">
                Ditch the mouse. SmartERP is fully mapped to hotkeys allowing power users to
                record transactions, create ledgers, add inventory items, and switch views in
                milliseconds.
              </p>
              <div className="lp-checklist">
                {[
                  'Instantly record vouchers without touching your mouse.',
                  'Quickly create ledger accounts inline while recording vouchers.',
                  'Use the Escape key to instantly back out of forms safely.',
                ].map((t, i) => (
                  <div key={i} className="lp-check-item">
                    <CheckCircle className="lp-check-icon" style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.1rem' }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp-shortcut-grid">
              {shortcuts.map((s, i) => (
                <div key={i} className="lp-shortcut-item">
                  <span className="lp-shortcut-desc">{s.desc}</span>
                  <kbd className="lp-shortcut-kbd">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────── */}
      <section className="lp-testimonials">
        <div className="lp-container">
          <div className="lp-features-header">
            <h2 className="lp-section-title">Loved by Accountants & Founders</h2>
            <p className="lp-section-subtitle">
              Don't just take our word for it. See what our users have to say about the speed and reliability of SmartERP.
            </p>
          </div>
          <div className="lp-testimonials-grid">
            {[
              { name: 'Rahul Sharma', role: 'CA, Sharma & Co.', text: 'The keyboard-first approach is a game changer. We process 500+ invoices daily without ever touching the mouse. It feels exactly like Tally but modern.' },
              { name: 'Priya Patel', role: 'Founder, TechNova', text: 'Live inventory and instant GST calculations saved us hours of manual work every month. The multi-company feature is perfectly implemented.' },
              { name: 'Anil Desai', role: 'Operations Manager', text: 'I was skeptical about moving our accounting to the cloud, but SmartERP is incredibly fast. The instant ledger creation is my favorite feature.' }
            ].map((t, i) => (
              <div key={i} className="lp-testimonial-card">
                <Quote size={32} className="lp-testimonial-quote" style={{ marginBottom: '1rem' }} />
                <p className="lp-testimonial-text">"{t.text}"</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.name.charAt(0)}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────── */}
      <section className="lp-pricing">
        <div className="lp-container">
          <div className="lp-features-header">
            <h2 className="lp-section-title">Simple, Transparent Pricing</h2>
            <p className="lp-section-subtitle">Start for free, upgrade when you need more power.</p>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-pricing-card">
              <h3>Free Plan</h3>
              <div className="lp-price">₹0<span>/month</span></div>
              <p className="lp-pricing-desc">Perfect for small businesses just getting started.</p>
              <div style={{ marginTop: 'auto', marginBottom: '2rem' }}>
                <NeonSweepButton tone="slate" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/register')}>Get Started</NeonSweepButton>
              </div>
              <div className="lp-pricing-features">
                <span><Check size={16} className="lp-check-icon" /> 1 Company</span>
                <span><Check size={16} className="lp-check-icon" /> 100 Vouchers/month</span>
                <span><Check size={16} className="lp-check-icon" /> Basic Inventory</span>
                <span><Check size={16} className="lp-check-icon" /> Email Support</span>
              </div>
            </div>
            <div className="lp-pricing-card lp-pricing-card-active">
              <div className="lp-pricing-badge">Most Popular</div>
              <h3>Pro Plan</h3>
              <div className="lp-price">₹999<span>/month</span></div>
              <p className="lp-pricing-desc">For growing businesses that need more capacity.</p>
              <div style={{ marginTop: 'auto', marginBottom: '2rem' }}>
                <NeonSweepButton tone="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/register')}>Start 14-Day Trial</NeonSweepButton>
              </div>
              <div className="lp-pricing-features">
                <span><Check size={16} className="lp-check-icon" /> 5 Companies</span>
                <span><Check size={16} className="lp-check-icon" /> Unlimited Vouchers</span>
                <span><Check size={16} className="lp-check-icon" /> Advanced Inventory & Reports</span>
                <span><Check size={16} className="lp-check-icon" /> Priority WhatsApp Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────── */}
      <section className="lp-faq">
        <div className="lp-container">
          <div className="lp-features-header">
            <h2 className="lp-section-title">Frequently Asked Questions</h2>
          </div>
          <div className="lp-faq-list">
            {[
              { q: 'Is my data secure?', a: 'Yes. We use industry-standard 256-bit AES encryption. Your data is backed up continuously across multiple secure cloud regions.' },
              { q: 'Can I import my data from Tally?', a: 'We currently support CSV imports for Ledgers and Inventory Items. Full Tally XML import is coming soon.' },
              { q: 'Do you support multi-user access?', a: 'Yes, on the Pro plan you can add up to 3 users with role-based access control (Admin, Data Entry, Viewer).' },
              { q: 'Is it fully GST compliant?', a: 'Absolutely. All invoices generated follow the strict formatting required by Indian GST laws, including HSN/SAC codes.' }
            ].map((faq, i) => (
              <div key={i} className={`lp-faq-item ${openFaq === i ? 'lp-faq-open' : ''}`}>
                <div 
                  className="lp-faq-q" 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown 
                    size={20} 
                    color="var(--text-secondary)" 
                    style={{
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  />
                </div>
                <div className="lp-faq-a-container">
                  <div className="lp-faq-a">
                    <div className="lp-faq-a-inner">{faq.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-glow" />
        <div className="lp-cta-inner">
          <div className="lp-cta-checklist">
            <span><CheckCircle className="lp-check-icon" size={16} /> GST Ready</span>
            <span><CheckCircle className="lp-check-icon" size={16} /> Multi Company</span>
            <span><CheckCircle className="lp-check-icon" size={16} /> Live Inventory</span>
            <span><CheckCircle className="lp-check-icon" size={16} /> Keyboard First</span>
          </div>
          <h2 className="lp-cta-title">Ready to Supercharge Your Business?</h2>
          <p className="lp-cta-desc">
            Join thousands of smart businesses utilizing our fast, robust, and keyboard-first
            accounting platform. Set up in seconds.
          </p>
          <div className="lp-trust-stars" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
          </div>
          <NeonSweepButton tone="primary" size="lg" onClick={() => navigate('/register')}>
            Create Your Free Account
          </NeonSweepButton>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-logo" onClick={() => navigate('/')}>
                <div className="lp-logo-icon">
                  <Zap style={{ width: '1.25rem', height: '1.25rem', fill: 'currentColor' }} />
                </div>
                <span className="lp-logo-text" style={{ fontSize: '1.25rem' }}>SmartERP</span>
              </div>
              <p className="lp-footer-desc">Modern Accounting at the Speed of Thought. Inspired by the best, built for the web.</p>
              <div className="lp-footer-madein">Made with ❤️ in 🇮🇳</div>
            </div>
            
            <div className="lp-footer-col">
              <h4>Product</h4>
              <span>Features</span>
              <span>Pricing</span>
              <span>Integrations</span>
              <span>Changelog</span>
            </div>
            
            <div className="lp-footer-col">
              <h4>Support</h4>
              <span>Documentation</span>
              <span>Help Center</span>
              <span>Contact Us</span>
              <span>Status</span>
            </div>
            
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security</span>
            </div>
          </div>
          
          <div className="lp-footer-bottom">
            <span>&copy; {new Date().getFullYear()} SmartERP. All rights reserved.</span>
            <div className="lp-footer-social">
              <span>Twitter</span>
              <span>LinkedIn</span>
              <span>GitHub</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
