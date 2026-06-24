import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../api/client';

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
                <label className="erp-label">Ledger Name *</label>
                <input {...register('name', { required: 'Name is required' })} className="erp-input" placeholder="e.g. Rahul Traders, Rent Expense" autoFocus />
                {errors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
              </div>
              <div>
                <label className="erp-label">Ledger Type *</label>
                <select 
                  {...register('ledger_type', { required: true })} 
                  disabled={isTypeFixed}
                  className="erp-select"
                >
                  {LEDGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Under Group</label>
                <select {...register('group_id')} className="erp-select">
                  <option value="">Select Group</option>
                  {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Opening Balance (₹)</label>
                <input {...register('opening_balance')} className="erp-input" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <label className="erp-label">Balance Type</label>
                <select {...register('balance_type')} className="erp-select">
                  <option value="Dr">Debit (Dr)</option>
                  <option value="Cr">Credit (Cr)</option>
                </select>
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
                  <input {...register('gst_number')} className="erp-input" placeholder="27AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="erp-label">PAN Number</label>
                  <input {...register('pan_number')} className="erp-input" placeholder="AAAAA0000A" />
                </div>
                <div>
                  <label className="erp-label">Phone</label>
                  <input {...register('phone')} className="erp-input" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="erp-label">Email</label>
                  <input {...register('email')} className="erp-input" type="email" placeholder="party@example.com" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="erp-label">Address</label>
                  <textarea {...register('address')} className="erp-input" rows={2} placeholder="Street, Area" />
                </div>
                <div>
                  <label className="erp-label">City</label>
                  <input {...register('city')} className="erp-input" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="erp-label">State</label>
                  <input {...register('state')} className="erp-input" placeholder="Maharashtra" />
                </div>
                <div>
                  <label className="erp-label">Pincode</label>
                  <input {...register('pincode')} className="erp-input" placeholder="400001" />
                </div>
                <div>
                  <label className="erp-label">Credit Limit (₹)</label>
                  <input {...register('credit_limit')} className="erp-input" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div>
                  <label className="erp-label">Credit Days</label>
                  <input {...register('credit_days')} className="erp-input" type="number" placeholder="30" />
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
