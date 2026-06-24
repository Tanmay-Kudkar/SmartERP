import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import NeonSweepButton from '../../components/NeonSweepButton';

export default function UnitList() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchUnits = async () => {
    try {
      const res = await api.get('/stock/units');
      setUnits(res.data.units);
    } catch {
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUnits(); }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/stock/units', data);
      toast.success('Unit created!');
      reset();
      setShowForm(false);
      fetchUnits();
    } catch {
      toast.error('Failed to create unit');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete unit "${name}"?`)) return;
    try {
      await api.delete(`/stock/units/${id}`);
      toast.success('Unit deleted');
      fetchUnits();
    } catch {
      toast.error('Cannot delete unit in use');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">Units of Measure</h1>
            <p className="page-subtitle">PCS, KG, BOX, LTR, etc. · <kbd className="kbd">Alt+U</kbd></p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Unit
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="erp-label">Unit Name</label>
                <input {...register('name', { required: 'Required' })} className="erp-input" placeholder="Kilogram" autoFocus />
              </div>
              <div style={{ width: '120px' }}>
                <label className="erp-label">Symbol</label>
                <input {...register('symbol', { required: 'Required' })} className="erp-input" placeholder="KG" />
              </div>
              <button type="submit" className="btn-primary">Add</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); reset(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map(u => (
                <tr key={u.id}>
                  <td data-label="Symbol"><span className="badge badge-blue">{u.symbol}</span></td>
                  <td data-label="Name" style={{ fontWeight: '500' }}>{u.name}</td>
                  <td className="action-cell" style={{ textAlign: 'right' }}>
                    <NeonSweepButton tone="danger" size="sm" onClick={() => handleDelete(u.id, u.name)}>
                      <Trash2 size={14} /> Remove
                    </NeonSweepButton>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No units found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
