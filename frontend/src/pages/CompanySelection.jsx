import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Building2, Plus, Pencil, Trash2, ChevronRight, Zap, LogOut, Moon, Sun, Calendar } from 'lucide-react';
import api from '../api/client';
import useStore from '../store/useStore';

function CompanyCard({ company, onSelect, onEdit, onDelete }) {
  return (
    <div className="glass-card" style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
      onClick={() => onSelect(company)}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{company.name}</div>
            {company.gst_number && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>GST: {company.gst_number}</div>}
            {company.city && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{company.city}{company.state ? `, ${company.state}` : ''}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn-icon" style={{ padding: '0.35rem' }} onClick={e => { e.stopPropagation(); onEdit(company); }}>
            <Pencil size={14} />
          </button>
          <button className="btn-icon" style={{ padding: '0.35rem', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }} onClick={e => { e.stopPropagation(); onDelete(company); }}>
            <Trash2 size={14} />
          </button>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );
}

function YearSelectInput({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempYear, setTempYear] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div 
        className="erp-input" 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)' }}
        onClick={() => {
          setTempYear(value);
          setIsOpen(!isOpen);
        }}
      >
        <span>1st April {value} to 31st March {value + 1}</span>
        <Calendar size={16} color="var(--text-muted)" />
      </div>

      {isOpen && (
        <div className="animate-fade-in" style={{ position: 'absolute', bottom: '100%', left: 0, minWidth: '220px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-blue)', borderRadius: '8px', padding: '0.875rem', marginBottom: '0.5rem', zIndex: 50, boxShadow: '0 -10px 25px rgba(0,0,0,0.4)' }}>
          <label className="erp-label">Enter Start Year (1800 - 2100)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="number" 
              min="1800" max="2100" 
              className="erp-input" 
              style={{ flex: 1, minWidth: '100px', background: 'var(--bg-card)' }}
              value={tempYear} 
              onChange={e => setTempYear(parseInt(e.target.value) || '')} 
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (tempYear >= 1800 && tempYear <= 2100) {
                    onChange(tempYear);
                    setIsOpen(false);
                  } else {
                    toast.error("Year must be between 1800 and 2100");
                  }
                }
              }}
            />
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => {
                if (tempYear >= 1800 && tempYear <= 2100) {
                  onChange(tempYear);
                  setIsOpen(false);
                } else {
                  toast.error("Year must be between 1800 and 2100");
                }
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyModal({ company, onClose, onSave }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Financial year defaults to current year (if month >= April) or previous year
  const defaultYear = company?.financial_year_start 
    ? new Date(company.financial_year_start).getFullYear() 
    : new Date().getMonth() >= 3 
      ? new Date().getFullYear() 
      : new Date().getFullYear() - 1;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ 
    defaultValues: { ...company, financial_year_start_year: defaultYear } 
  });
  const [loading, setLoading] = useState(false);

  const startYear = watch('financial_year_start_year');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const year = parseInt(data.financial_year_start_year, 10);
      const payload = {
        ...data,
        financial_year_start: `${year}-04-01`,
        financial_year_end: `${year + 1}-03-31`
      };
      delete payload.financial_year_start_year;

      if (company?.id) {
        await onSave('edit', payload, company.id);
      } else {
        await onSave('create', payload);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-fade-in" style={{ maxWidth: '640px' }}>
        <div style={{ padding: 'clamp(1rem, 4vw, 1.5rem)', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: '700', fontSize: '1.125rem' }}>{company?.id ? 'Edit Company' : 'Create New Company'}</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 'clamp(1rem, 4vw, 1.5rem)' }}>
          <div className="form-grid">
            <div style={{ gridColumn: '1/-1' }}>
              <label className="erp-label">Company Name *</label>
              <input {...register('name', { required: 'Company Name is required' })} className="erp-input" placeholder="ABC Traders" autoFocus />
              {errors.name && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.name.message}</p>}
            </div>
            <div>
              <label className="erp-label">GST Number</label>
              <input 
                {...register('gst_number', { 
                  pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i, message: 'Invalid GST format' } 
                })} 
                className="erp-input" placeholder="27AAAAA0000A1Z5" 
                onInput={e => e.target.value = e.target.value.toUpperCase()}
              />
              {errors.gst_number && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.gst_number.message}</p>}
            </div>
            <div>
              <label className="erp-label">PAN Number</label>
              <input 
                {...register('pan_number', { 
                  pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, message: 'Invalid PAN format' } 
                })} 
                className="erp-input" placeholder="AAAAA0000A" 
                onInput={e => e.target.value = e.target.value.toUpperCase()}
              />
              {errors.pan_number && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.pan_number.message}</p>}
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="erp-label">Address *</label>
              <input {...register('address', { required: 'Address is required' })} className="erp-input" placeholder="Shop No. 12, Station Road" />
              {errors.address && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.address.message}</p>}
            </div>
            <div>
              <label className="erp-label">City *</label>
              <input {...register('city', { required: 'City is required' })} className="erp-input" placeholder="Mumbai" />
              {errors.city && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.city.message}</p>}
            </div>
            <div>
              <label className="erp-label">State *</label>
              <input {...register('state', { required: 'State is required' })} className="erp-input" placeholder="Maharashtra" />
              {errors.state && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.state.message}</p>}
            </div>
            <div>
              <label className="erp-label">Pincode *</label>
              <input 
                {...register('pincode', { 
                  required: 'Pincode is required',
                  pattern: { value: /^[0-9]{6}$/, message: 'Must be 6 digits' } 
                })} 
                className="erp-input" placeholder="400001" 
                maxLength={6}
              />
              {errors.pincode && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.pincode.message}</p>}
            </div>
            <div>
              <label className="erp-label">Phone *</label>
              <input 
                {...register('phone', { required: 'Phone is required' })} 
                className="erp-input" placeholder="+91 98765 43210" 
              />
              {errors.phone && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.phone.message}</p>}
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="erp-label">Financial Year (Starting April 1st) *</label>
              <YearSelectInput 
                value={startYear} 
                onChange={y => setValue('financial_year_start_year', y, { shouldValidate: true })} 
              />
              <input type="hidden" {...register('financial_year_start_year', { required: 'Required', min: 1800, max: 2100 })} />
              {errors.financial_year_start_year && <p className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.financial_year_start_year.message}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Company'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CompanySelection() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const navigate = useNavigate();
  const { setActiveCompany, user, logout, theme, setTheme } = useStore();

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data.companies);
    } catch {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleSelect = (company) => {
    setActiveCompany(company);
    toast.success(`Switched to ${company.name}`);
    navigate('/dashboard');
  };

  const handleSave = async (mode, data, id) => {
    try {
      if (mode === 'create') {
        await api.post('/companies', data);
        toast.success('Company created!');
      } else {
        await api.put(`/companies/${id}`, data);
        toast.success('Company updated!');
      }
      setShowModal(false);
      setEditCompany(null);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save company');
    }
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`Delete "${company.name}"? This will remove all its data.`)) return;
    try {
      await api.delete(`/companies/${company.id}`);
      toast.success('Company deleted');
      fetchCompanies();
    } catch {
      toast.error('Failed to delete company');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem 1rem' }}>
      <div style={{ position: 'fixed', top: '-100px', left: '30%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.25rem' }}>SmartERP</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Welcome, {user?.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="btn-secondary" onClick={() => { logout(); navigate('/login'); }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)' }}>Select Company</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Choose a company to manage or create a new one</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {companies.map(c => (
              <CompanyCard key={c.id} company={c} onSelect={handleSelect} onEdit={(c) => { setEditCompany(c); setShowModal(true); }} onDelete={handleDelete} />
            ))}

            {companies.length < 5 && (
              <button
                className="glass-card"
                style={{ padding: '1.25rem', border: '2px dashed var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.2s', width: '100%', borderRadius: '12px' }}
                onClick={() => { setEditCompany(null); setShowModal(true); }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Plus size={18} /> Create New Company {companies.length > 0 ? `(${companies.length}/5 used)` : ''}
              </button>
            )}

            {companies.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Building2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No companies yet. Create your first one!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <CompanyModal
          company={editCompany}
          onClose={() => { setShowModal(false); setEditCompany(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
