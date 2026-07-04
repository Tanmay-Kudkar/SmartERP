import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Trash2, ArrowLeft, Package, ClipboardList, Search, Plus, RotateCcw, AlertCircle, SortAsc, Clock, Download, Upload, Edit, Eye } from 'lucide-react';
import api from '../../api/client';
import CustomSelect from '../../components/CustomSelect';

/* ── inline styles for custom thin scrollbar & row animations ── */
const scrollbarStyle = `
  .units-list::-webkit-scrollbar { width: 4px; }
  .units-list::-webkit-scrollbar-track { background: transparent; }
  .units-list::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 99px; }
  .units-list::-webkit-scrollbar-thumb:hover { background: #2563eb; }

  .unit-card { transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s; }
  .unit-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #CBD5E1 !important; transform: translateY(-2px); }
  .unit-card .action-btn { opacity: 0; transition: opacity 0.2s, color 0.2s, background 0.2s; }
  .unit-card:hover .action-btn { opacity: 1; }

  @keyframes rowSlideIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .unit-row-new { animation: rowSlideIn 0.3s ease; }
  
  .filter-chip { transition: all 0.2s; cursor: pointer; user-select: none; }
  .filter-chip:hover { opacity: 0.9; }
`;

export default function UnitList() {
  const [units, setUnits]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sortMode, setSortMode]     = useState('alpha'); // 'alpha' | 'recent' | 'usage'
  const [activeFilter, setActiveFilter] = useState('All');
  const [newRowId, setNewRowId]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, symbol, usage_count }
  const [editId, setEditId]         = useState(null);
  const navigate = useNavigate();
  const nameRef = useRef(null);

  // Lock body scroll when delete modal is open
  useEffect(() => {
    if (deleteTarget) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [deleteTarget]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      symbol: '',
      description: '',
      is_base_unit: false,
      unit_type: 'Quantity'
    }
  });

  const watchName = watch('name');
  const watchSymbol = watch('symbol');
  const watchType = watch('unit_type');

  /* ── fetch ── */
  const fetchUnits = useCallback(async () => {
    try {
      const res = await api.get('/stock/units');
      setUnits(res.data.units);
    } catch {
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        nameRef.current?.focus();
      }
      if (e.key === 'Escape') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleReset = () => {
    reset({
      name: '',
      symbol: '',
      description: '',
      is_base_unit: false,
      unit_type: 'Quantity'
    });
    setEditId(null);
    nameRef.current?.focus();
  };

  /* ── duplicate check while typing ── */
  const duplicateWarning = units.find(u => 
    u.id !== editId && (
      (watchName && u.name.toLowerCase() === watchName.trim().toLowerCase()) ||
      (watchSymbol && u.symbol.toLowerCase() === watchSymbol.trim().toLowerCase())
    )
  );

  /* ── submit ── */
  const onSubmit = async (data) => {
    if (duplicateWarning) {
      setError('name', { message: `Already exists (${duplicateWarning.symbol})` });
      return;
    }
    
    try {
      if (editId) {
        await api.put(`/stock/units/${editId}`, data);
        toast.success(`✓ ${data.name} updated successfully`);
      } else {
        const res = await api.post('/stock/units', data);
        toast.success(`✓ ${data.name} created successfully`);
        const created = res.data?.unit;
        if (created?.id) {
          setNewRowId(created.id);
          setTimeout(() => setNewRowId(null), 2000);
        }
      }
      handleReset();
      await fetchUnits();
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('duplicate')) {
        setError('name', { message: 'This unit already exists' });
      } else {
        toast.error(`Failed to ${editId ? 'update' : 'create'} unit`);
      }
    }
  };

  /* ── delete flow ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/stock/units/${deleteTarget.id}`);
      toast.success(`Unit "${deleteTarget.name}" deleted`);
      fetchUnits();
    } catch {
      toast.error('Cannot delete — unit is in use');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEdit = (u) => {
    setEditId(u.id);
    setValue('name', u.name);
    setValue('symbol', u.symbol);
    setValue('description', u.description || '');
    setValue('is_base_unit', u.is_base_unit || false);
    setValue('unit_type', u.unit_type || 'Quantity');
    nameRef.current?.focus();
  };

  /* ── Badge coloring ── */
  const getBadgeClass = (type) => {
    switch (type) {
      case 'Length': return 'badge-blue';
      case 'Weight': return 'badge-green';
      case 'Volume': return 'badge-orange';
      case 'Quantity': return 'badge-purple';
      default: return 'badge-gray';
    }
  };

  /* ── filtered + sorted list ── */
  const filtered = units
    .filter(u => 
      (activeFilter === 'All' || u.unit_type === activeFilter) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.symbol.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortMode === 'usage') return (b.usage_count || 0) - (a.usage_count || 0);
      if (sortMode === 'recent') return b.id - a.id;
      return a.name.localeCompare(b.name);
    });

  /* ── register ref forwarding ── */
  const { ref: rhfNameRef, ...nameRest } = register('name', { required: 'Unit name is required' });

  return (
    <>
      <style>{scrollbarStyle}</style>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{ padding: '1.75rem', maxWidth: '350px', width: '100%', margin: '1rem', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Trash2 size={18} color="#ef4444" />
            </div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Delete Unit?</div>
            
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '0.75rem 1rem', margin: '1rem 0', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`badge ${getBadgeClass(deleteTarget.unit_type)}`} style={{ fontWeight: '700' }}>
                {deleteTarget.symbol}
              </span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{deleteTarget.name}</span>
            </div>

            {deleteTarget.usage_count > 0 ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '1.25rem', textAlign: 'left', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Used by {deleteTarget.usage_count} products</strong><br/>
                  Cannot delete until unused.
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                This action cannot be undone.
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button 
                className="btn-danger" 
                style={{ flex: 1, opacity: deleteTarget.usage_count > 0 ? 0.5 : 1 }} 
                onClick={confirmDelete}
                disabled={deleteTarget.usage_count > 0}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="animate-fade-in" style={{ margin: '0 auto', padding: '0 1rem' }}>

        {/* Header */}
        <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-icon" onClick={() => navigate(-1)} title="Go Back">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="page-title">
                Units of Measure
              </h1>
              <p className="page-subtitle">Manage all inventory units used across stock items.</p>
            </div>
            
            {/* Header Unit Count */}
            <div style={{ marginLeft: '1rem', background: 'linear-gradient(135deg,#3b82f620,#3b82f630)', border: '1px solid #3b82f640', borderRadius: '99px', padding: '0.2rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3b82f6', fontWeight: '600', fontSize: '0.8rem' }}>
              <span>{units.length} Active Units</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={() => nameRef.current?.focus()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> New Unit
            </button>
          </div>
        </div>

        {/* 35% / 65% grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '35% 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── LEFT: Create Form ── */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {editId ? <Edit size={15} color="#fff" /> : <Package size={15} color="#fff" />}
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {editId ? 'Edit Unit' : 'Create Unit'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Unit Name */}
                  <div>
                    <label className="erp-label" htmlFor="unit-name-input">
                      Unit Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="unit-name-input"
                      {...nameRest}
                      ref={e => { rhfNameRef(e); nameRef.current = e; }}
                      className="erp-input"
                      placeholder="e.g. Kilogram"
                    />
                    {errors.name && (
                      <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertCircle size={12} /> {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Symbol */}
                  <div>
                    <label className="erp-label" htmlFor="unit-symbol-input">
                      Short Symbol <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="unit-symbol-input"
                      {...register('symbol', { required: 'Symbol required' })}
                      className="erp-input"
                      placeholder="e.g. KG"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.symbol && (
                      <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertCircle size={12} /> {errors.symbol.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duplicate Warning while typing */}
                {duplicateWarning && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <AlertCircle size={14} />
                    <span>
                      <strong>{duplicateWarning.name}</strong> already exists. 
                      <button type="button" onClick={() => handleEdit(duplicateWarning)} style={{ background: 'none', border: 'none', color: '#d97706', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginLeft: '4px' }}>
                        Open existing →
                      </button>
                    </span>
                  </div>
                )}

                {/* Unit Type */}
                <div>
                  <label className="erp-label">Unit Type</label>
                  <CustomSelect 
                    value={watchType}
                    onChange={(val) => setValue('unit_type', val)}
                    options={[
                      { label: 'Quantity (PCS, BOX)', value: 'Quantity' },
                      { label: 'Length (MTR, CM)', value: 'Length' },
                      { label: 'Weight (KG, GM)', value: 'Weight' },
                      { label: 'Volume (LTR, ML)', value: 'Volume' },
                      { label: 'Other', value: 'Other' }
                    ]}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="erp-label">Description (optional)</label>
                  <input
                    {...register('description')}
                    className="erp-input"
                    placeholder="e.g. Metric system weight unit"
                  />
                </div>

                {/* Base Unit Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="base-unit-checkbox"
                    {...register('is_base_unit')}
                    style={{ width: '1rem', height: '1rem' }}
                  />
                  <label htmlFor="base-unit-checkbox" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    Base Unit
                  </label>
                </div>

                {/* Live Preview */}
                {(watchName || watchSymbol) && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label className="erp-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <Eye size={12} /> Preview
                    </label>
                    <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                       <span className={`badge ${getBadgeClass(watchType)}`} style={{ padding: '0.3rem 0.6rem', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                         {watchSymbol || 'SYM'}
                       </span>
                       <div>
                         <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{watchName || 'Unit Name'}</div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleReset}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    disabled={isSubmitting}
                  >
                    {editId ? <Edit size={14} /> : <Plus size={14} />}
                    {isSubmitting ? 'Saving…' : (editId ? 'Update Unit' : 'Create Unit')}
                  </button>
                </div>

                {/* Keyboard hint */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <kbd className="kbd">Tab</kbd> Next Field
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <kbd className="kbd">Enter</kbd> Save
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <kbd className="kbd">Esc</kbd> Reset
                  </p>
                </div>

              </div>
            </form>
          </div>

          {/* ── RIGHT: Active Units List ── */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Top Toolbar (Search, Filter, Sort) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="erp-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="🔍 Search name or symbol..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Sort</span>
                <CustomSelect 
                  value={sortMode}
                  onChange={setSortMode}
                  options={[
                    { label: '▼ Name (A-Z)', value: 'alpha' },
                    { label: '▼ Recently Added', value: 'recent' },
                    { label: '▼ Most Used', value: 'usage' }
                  ]}
                  style={{ minWidth: '150px' }}
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Weight', 'Length', 'Volume', 'Quantity'].map(f => {
                const count = f === 'All' ? units.length : units.filter(u => u.unit_type === f).length;
                return (
                  <div
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="filter-chip"
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: activeFilter === f ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                      color: activeFilter === f ? '#fff' : 'var(--text-muted)',
                      border: `1px solid ${activeFilter === f ? 'var(--accent-blue)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    {f} <span style={{ opacity: 0.7 }}>({count})</span>
                  </div>
                )
              })}
            </div>

            {/* List */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner" />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                {search ? (
                  <>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>No units found</div>
                    <div style={{ fontSize: '0.85rem' }}>Try adjusting your search or filters</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>No Units Created</div>
                    <div style={{ fontSize: '0.85rem' }}>Create your first measurement unit using the form.</div>
                  </>
                )}
              </div>
            ) : (
              <div
                className="units-list"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', overflowY: 'auto', maxHeight: '55vh', paddingRight: '4px', paddingBottom: '4px' }}
              >
                {filtered.map(u => (
                  <div
                    key={u.id}
                    className={`unit-card ${newRowId === u.id ? 'unit-row-new' : ''}`}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`badge ${getBadgeClass(u.unit_type)}`} style={{ padding: '0.3rem 0.6rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                          {u.symbol}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>{u.name}</div>
                          {u.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{u.description}</div>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Package size={14} /> 
                        {u.usage_count > 0 ? `Used in ${u.usage_count} item${u.usage_count !== '1' ? 's' : ''}` : 'Not used yet'}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="action-btn"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-muted)' }}
                          onClick={() => handleEdit(u)}
                          onMouseEnter={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = '#3b82f615'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                          title={`Edit ${u.name}`}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="action-btn"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-muted)' }}
                          onClick={() => setDeleteTarget(u)}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#ef444415'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                          title={`Delete ${u.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
