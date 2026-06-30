import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Trash2, ArrowLeft, Package, ClipboardList, Search, Plus, RotateCcw, AlertCircle, SortAsc, Clock } from 'lucide-react';
import api from '../../api/client';

/* ── inline styles for custom thin scrollbar & row animations ── */
const scrollbarStyle = `
  .units-list::-webkit-scrollbar { width: 4px; }
  .units-list::-webkit-scrollbar-track { background: transparent; }
  .units-list::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 99px; }
  .units-list::-webkit-scrollbar-thumb:hover { background: #2563eb; }

  .unit-row { transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s; }
  .unit-row:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.12); border-color: #CBD5E1 !important; transform: translateY(-1px); }
  .unit-row .del-btn { opacity: 0; transition: opacity 0.18s, color 0.18s, background 0.18s; }
  .unit-row:hover .del-btn { opacity: 1; }

  @keyframes rowSlideIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .unit-row-new { animation: rowSlideIn 0.3s ease; }

  @keyframes rowHighlight {
    0%   { background: rgba(59,130,246,0.18); }
    100% { background: var(--bg-card); }
  }
  .unit-row-highlight { animation: rowHighlight 1.6s ease; }
`;

export default function UnitList() {
  const [units, setUnits]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sortMode, setSortMode]     = useState('alpha'); // 'alpha' | 'recent'
  const [newRowId, setNewRowId]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const navigate = useNavigate();
  const nameRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

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

  /* ── keyboard shortcuts: Alt+U focus, Enter submit, Esc reset ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        nameRef.current?.focus();
      }
      if (e.key === 'Escape') {
        reset();
        nameRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset]);

  /* ── submit ── */
  const onSubmit = async (data) => {
    // duplicate check client-side
    const dup = units.find(
      u => u.name.toLowerCase() === data.name.trim().toLowerCase() ||
           u.symbol.toLowerCase() === data.symbol.trim().toLowerCase()
    );
    if (dup) {
      setError('name', { message: `"${dup.name}" already exists (${dup.symbol})` });
      return;
    }
    try {
      const res = await api.post('/stock/units', data);
      const created = res.data?.unit;
      toast.success(`✓ ${data.name} (${data.symbol}) added successfully`);
      reset();
      await fetchUnits();
      if (created?.id) {
        setNewRowId(created.id);
        setTimeout(() => setNewRowId(null), 2000);
      }
      nameRef.current?.focus();
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('duplicate')) {
        setError('name', { message: 'This unit already exists' });
      } else {
        toast.error('Failed to create unit');
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
      toast.error('Cannot delete — unit is in use by inventory items');
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── filtered + sorted list ── */
  const filtered = units
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortMode === 'alpha') return a.name.localeCompare(b.name);
      return b.id - a.id; // recent first by id
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
            style={{ padding: '1.75rem', maxWidth: '320px', width: '100%', margin: '1rem', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Trash2 size={18} color="#ef4444" />
            </div>
            {/* Title */}
            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Delete Unit?</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>This cannot be undone.</div>
            {/* Unit preview */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-blue" style={{ fontWeight: '700', fontSize: '0.7rem' }}>{deleteTarget.symbol?.toUpperCase() || deleteTarget.name.toUpperCase().slice(0,4)}</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{deleteTarget.name}</span>
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="animate-fade-in" style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1rem' }}>

        {/* Header */}
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-icon" onClick={() => navigate(-1)} title="Go Back">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="page-title">Units of Measure</h1>
              <p className="page-subtitle">Configure inventory measurement units · <kbd className="kbd">Alt+U</kbd></p>
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── LEFT: Create Form ── */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={15} color="#fff" />
              </div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Create New Unit</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

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
                    autoFocus
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
                    Symbol <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="unit-symbol-input"
                    {...register('symbol', { required: 'Symbol is required' })}
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

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    disabled={isSubmitting}
                  >
                    <Plus size={14} />
                    {isSubmitting ? 'Adding…' : 'Add Unit'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { reset(); nameRef.current?.focus(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Reset form (Esc)"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                </div>

                {/* Keyboard hint */}
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                  <kbd className="kbd" style={{ fontSize: '0.65rem' }}>Tab</kbd> next field ·{' '}
                  <kbd className="kbd" style={{ fontSize: '0.65rem' }}>Enter</kbd> add ·{' '}
                  <kbd className="kbd" style={{ fontSize: '0.65rem' }}>Esc</kbd> reset
                </p>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Active Units List ── */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* List header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ClipboardList size={15} color="#fff" />
                </div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Active Units
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.1rem 0.55rem',
                    background: 'linear-gradient(135deg,#3b82f620,#3b82f630)',
                    border: '1px solid #3b82f640',
                    borderRadius: '99px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#3b82f6',
                  }}>
                    {units.length}
                  </span>
                </h2>
              </div>

              {/* Sort toggle */}
              <button
                className="btn-icon"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}
                onClick={() => setSortMode(m => m === 'alpha' ? 'recent' : 'alpha')}
                title="Toggle sort"
              >
                {sortMode === 'alpha' ? <SortAsc size={14} /> : <Clock size={14} />}
                {sortMode === 'alpha' ? 'A–Z' : 'Recent'}
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className="erp-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                placeholder="Search units…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* List */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner" />
              </div>
            ) : filtered.length === 0 ? (
              /* Empty state */
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                {search ? (
                  <>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>No results for "{search}"</div>
                    <div style={{ fontSize: '0.8rem' }}>Try a different name or symbol</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>No units yet</div>
                    <div style={{ fontSize: '0.8rem' }}>Create your first unit using the form on the left</div>
                  </>
                )}
              </div>
            ) : (
              <div
                className="units-list"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', maxHeight: '52vh', paddingRight: '2px' }}
              >
                {filtered.map(u => (
                  <div
                    key={u.id}
                    className={`unit-row ${newRowId === u.id ? 'unit-row-new unit-row-highlight' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.65rem',
                      background: 'var(--bg-card)',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Badge */}
                      <span
                        className="badge badge-blue"
                        style={{
                          minWidth: '48px',
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          fontWeight: '700',
                          fontSize: '0.7rem',
                          letterSpacing: '0.04em',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        {u.symbol}
                      </span>
                      {/* Name */}
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {u.name}
                      </span>
                    </div>

                    {/* Delete — visible only on row hover */}
                    <button
                      className="del-btn"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        borderRadius: '6px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: 'auto',
                        flexShrink: 0,
                      }}
                      onClick={() => setDeleteTarget({ id: u.id, name: u.name, symbol: u.symbol })}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = '#ef444415';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title={`Delete ${u.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
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
