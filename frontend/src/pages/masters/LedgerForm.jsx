import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../api/client';
import CustomSelect from '../../components/CustomSelect';

const LEDGER_TYPES = [
  { value: 'customer', label: 'Customer' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'expense', label: 'Expense Account' },
  { value: 'income', label: 'Income Account' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'cash', label: 'Cash Account' },
];

const DEFAULT_GROUPS = {
  customer: 'Sundry Debtors',
  supplier: 'Sundry Creditors',
  expense: 'Indirect Expenses',
  income: 'Indirect Income',
  bank: 'Bank Accounts',
  cash: 'Cash-in-Hand',
};

export default function LedgerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!id);
  const [groups, setGroups] = useState([]);
  const isEdit = !!id;

  const defaultType = searchParams.get('type') || 'customer';
  const typeParam = searchParams.get('type');
  const isTypeFixed = typeParam === 'customer' || typeParam === 'supplier';

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { ledger_type: defaultType, balance_type: 'Dr', opening_balance: 0, credit_days: 0 }
  });

  const ledgerType = watch('ledger_type');
  const groupId = watch('group_id');
  const balanceType = watch('balance_type');

  useEffect(() => {
    api.get('/ledgers/groups').then(r => setGroups(r.data.groups)).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      setFetchLoading(true);
      api.get(`/ledgers/${id}`)
        .then(r => { reset(r.data.ledger); })
        .catch(() => toast.error('Failed to load ledger'))
        .finally(() => setFetchLoading(false));
    }
  }, [id]);

  // Auto-select group when type changes
  useEffect(() => {
    if (!isEdit && groups.length > 0 && ledgerType) {
      const defaultName = DEFAULT_GROUPS[ledgerType];
      const grp = groups.find(g => g.name === defaultName);
      if (grp) setValue('group_id', grp.id);
    }
  }, [ledgerType, groups, isEdit]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        ledger_type: isTypeFixed ? typeParam : data.ledger_type,
      };
      if (isEdit) {
        await api.put(`/ledgers/${id}`, payload);
        toast.success('Ledger updated successfully!');
      } else {
        await api.post('/ledgers', payload);
        toast.success('Ledger created successfully!');
      }
      if (typeParam) {
        navigate(`/ledgers?type=${typeParam}`);
      } else {
        navigate('/ledgers');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save ledger');
    } finally {
      setLoading(false);
    }
  };

  const isPartyType = ['customer', 'supplier'].includes(ledgerType);
  const filteredGroups = groups.filter(g => {
    if (ledgerType === 'customer') return g.nature === 'asset';
    if (ledgerType === 'supplier') return g.nature === 'liability';
    if (ledgerType === 'expense') return g.nature === 'expense';
    if (ledgerType === 'income') return g.nature === 'income';
    if (ledgerType === 'bank' || ledgerType === 'cash') return g.nature === 'asset';
    return true;
  });

  if (fetchLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Ledger' : 'Create Ledger'}</h1>
            <p className="page-subtitle">{isEdit ? 'Update ledger information' : 'Add a new account, customer, or supplier'}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Info */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--accent-blue)' }}>Basic Information</div>
            <div className="form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label className="erp-label">Ledger Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input {...register('name', { required: 'Name is required' })} className="erp-input" placeholder="e.g. Rahul Traders, Rent Expense" autoFocus />
                {errors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
              </div>
              <div>
                <label className="erp-label">Ledger Type <span style={{ color: '#ef4444' }}>*</span></label>
                <CustomSelect 
                  value={ledgerType}
                  onChange={v => setValue('ledger_type', v)}
                  options={LEDGER_TYPES}
                  disabled={isTypeFixed}
                />
              </div>
              <div>
                <label className="erp-label">Under Group</label>
                <CustomSelect 
                  value={groupId}
                  onChange={v => setValue('group_id', v)}
                  options={filteredGroups.map(g => ({ label: g.name, value: g.id }))}
                  placeholder="Select Group"
                />
              </div>
              <div>
                <label className="erp-label">Opening Balance (₹)</label>
                <input {...register('opening_balance')} className="erp-input" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <label className="erp-label">Balance Type</label>
                <CustomSelect 
                  value={balanceType}
                  onChange={v => setValue('balance_type', v)}
                  options={[
                    { label: 'Debit (Dr)', value: 'Dr' },
                    { label: 'Credit (Cr)', value: 'Cr' }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Party Details (only for customer/supplier) */}
          {isPartyType && (
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--accent-blue)' }}>Contact & Tax Information</div>
              <div className="form-grid">
                <div>
                  <label className="erp-label">GST Number</label>
                  <input {...register('gst_number', { 
                    pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i, message: 'Format: 27ABCDE1234F1Z5' }
                  })} className="erp-input" placeholder="27AAAAA0000A1Z5" style={{ textTransform: 'uppercase' }} maxLength={15} onInput={e => e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '')} />
                  {errors.gst_number && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.gst_number.message}</p>}
                </div>
                <div>
                  <label className="erp-label">PAN Number</label>
                  <input {...register('pan_number', {
                    pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, message: 'Format: ABCDE1234F' }
                  })} className="erp-input" placeholder="AAAAA0000A" style={{ textTransform: 'uppercase' }} maxLength={10} onInput={e => e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '')} />
                  {errors.pan_number && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.pan_number.message}</p>}
                </div>
                <div>
                  <label className="erp-label">Phone</label>
                  <div style={{ display: 'flex' }}>
                    <div style={{ 
                      padding: '0.6rem 0.8rem', 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border)', 
                      borderRight: 'none', 
                      borderRadius: '8px 0 0 8px', 
                      color: 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      +91
                    </div>
                    <input {...register('phone', {
                      pattern: { value: /^[0-9]{10}$/, message: 'Must be exactly 10 digits' }
                    })} className="erp-input" type="tel" maxLength={10} placeholder="9876543210" onInput={e => e.target.value = e.target.value.replace(/[^0-9]/g, '')} style={{ flex: 1, borderRadius: '0 8px 8px 0' }} />
                  </div>
                  {errors.phone && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="erp-label">Email</label>
                  <input {...register('email', {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' }
                  })} className="erp-input" type="email" placeholder="party@example.com" />
                  {errors.email && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="erp-label">Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea 
                    {...register('address', { required: 'Address is required' })} 
                    className="erp-input" 
                    placeholder="Street, Area... (Auto-expands as you type)" 
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    style={{ resize: 'none', minHeight: '80px', overflow: 'hidden', lineHeight: '1.5', padding: '0.75rem' }}
                  />
                  {errors.address && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.address.message}</p>}
                </div>
                <div>
                  <label className="erp-label">City <span style={{ color: '#ef4444' }}>*</span></label>
                  <input {...register('city', { required: 'City is required' })} className="erp-input" placeholder="Mumbai" />
                  {errors.city && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.city.message}</p>}
                </div>
                <div>
                  <label className="erp-label">State <span style={{ color: '#ef4444' }}>*</span></label>
                  <input {...register('state', { required: 'State is required' })} className="erp-input" placeholder="Maharashtra" />
                  {errors.state && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.state.message}</p>}
                </div>
                <div>
                  <label className="erp-label">Pincode <span style={{ color: '#ef4444' }}>*</span></label>
                  <input {...register('pincode', {
                    required: 'Pincode is required',
                    pattern: { value: /^[0-9]{6}$/, message: 'Must be exactly 6 digits' }
                  })} className="erp-input" type="text" maxLength={6} pattern="[0-9]{6}" placeholder="400001" onInput={e => e.target.value = e.target.value.replace(/[^0-9]/g, '')} />
                  {errors.pincode && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.pincode.message}</p>}
                </div>
                <div>
                  <label className="erp-label">Credit Limit (₹)</label>
                  <input {...register('credit_limit', { min: { value: 0, message: 'Cannot be negative' } })} className="erp-input" type="number" step="0.01" min="0" placeholder="0.00" />
                  {errors.credit_limit && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.credit_limit.message}</p>}
                </div>
                <div>
                  <label className="erp-label">Credit Days</label>
                  <input {...register('credit_days', { min: { value: 0, message: 'Cannot be negative' } })} className="erp-input" type="number" min="0" placeholder="30" />
                  {errors.credit_days && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.credit_days.message}</p>}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={15} />
              {loading ? 'Saving...' : isEdit ? 'Update Ledger' : 'Create Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
