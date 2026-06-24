import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Zap, User, Mail, Lock, Moon, Sun } from 'lucide-react';
import api from '../api/client';
import useStore from '../store/useStore';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);
  const { theme, setTheme } = useStore();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name: data.name, email: data.email, password: data.password });
      setAuth(res.data.user, res.data.token);
      toast.success('Account created! Welcome to SmartERP.');
      navigate('/companies');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <button 
        className="btn-icon" 
        style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 50 }} 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: 'clamp(1.5rem, 5vw, 2.5rem)', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: '14px', marginBottom: '1rem' }}>
            <Zap size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Start managing your business</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="erp-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input {...register('name', { required: 'Name is required' })} className="erp-input" style={{ paddingLeft: '2.5rem' }} placeholder="Your full name" autoFocus />
            </div>
            {errors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="erp-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} className="erp-input" style={{ paddingLeft: '2.5rem' }} placeholder="you@example.com" type="email" />
            </div>
            {errors.email && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="erp-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })} className="erp-input" style={{ paddingLeft: '2.5rem' }} placeholder="Min 6 characters" type="password" />
            </div>
            {errors.password && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password.message}</p>}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="erp-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input {...register('confirmPassword', { required: 'Confirm your password', validate: v => v === watch('password') || 'Passwords do not match' })} className="erp-input" style={{ paddingLeft: '2.5rem' }} placeholder="••••••••" type="password" />
            </div>
            {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
