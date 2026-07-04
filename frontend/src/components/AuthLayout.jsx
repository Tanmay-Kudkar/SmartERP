import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle, BarChart3, Package, FileText } from 'lucide-react';
import useStore from '../store/useStore';
import { Sun, Moon } from 'lucide-react';
import '../pages/Auth.css';

export default function AuthLayout({ children }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useStore();

  return (
    <div className="auth-layout">
      {/* ── Left Pane: Dashboard Preview ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="auth-brand-icon">
              <Zap size={24} />
            </div>
            <div className="auth-brand-text">SmartERP</div>
          </div>
          
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '2rem' }}>
            Business Accounting Platform <br />
            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Trusted by 5,000+ businesses</span>
          </div>

          <div className="auth-preview-card">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={20} color="var(--accent-blue)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>₹ 2,45,890.00</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: <Package size={14} />, text: 'Inventory Sync Completed', time: 'Just now' },
                { icon: <FileText size={14} />, text: 'New Invoice #INV-2026', time: '2m ago' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>{item.icon}</div>
                  <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.text}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.time}</div>
                </div>
              ))}
            </div>

            <div className="auth-features">
              <div className="auth-feature" style={{ color: 'var(--text-secondary)' }}><CheckCircle size={16} color="var(--accent-green)" /> GST Ready</div>
              <div className="auth-feature" style={{ color: 'var(--text-secondary)' }}><CheckCircle size={16} color="var(--accent-green)" /> Live Inventory</div>
              <div className="auth-feature" style={{ color: 'var(--text-secondary)' }}><CheckCircle size={16} color="var(--accent-green)" /> Multi Company</div>
              <div className="auth-feature" style={{ color: 'var(--text-secondary)' }}><CheckCircle size={16} color="var(--accent-green)" /> Keyboard First</div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <Zap size={14} color="var(--accent-orange)" />
            <span>Tip: Press <strong>Enter</strong> to Sign In or <strong>Esc</strong> to go back</span>
          </div>
        </div>
      </div>

      {/* ── Right Pane: Form Container ── */}
      <div className="auth-right">
        <button 
          className="btn-icon" 
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 50 }} 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="auth-glass-card">
          {children}
        </div>

        <div className="auth-footer">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
          <span>Version 1.0</span>
          <span>Made in 🇮🇳</span>
        </div>
      </div>
    </div>
  );
}
