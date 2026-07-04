import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Mail, Lock, CheckCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import useStore from '../store/useStore';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);

  const password = watch('password') || '';
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = (hasUppercase ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);

  const getMeterColor = () => {
    if (password.length === 0) return 'var(--border)';
    if (strengthScore === 0) return '#ef4444'; // red
    if (strengthScore === 1 || strengthScore === 2) return '#f59e0b'; // yellow
    return '#10b981'; // green
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name: data.name, email: data.email, password: data.password });
      setAuth(res.data.user, res.data.token);
      toast.success('Account created! Welcome to SmartERP.');
      navigate('/companies');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('email', { type: 'manual', message: 'An account with this email already exists. Please sign in instead.' });
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👋</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Create Account</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Grow your business with SmartERP</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-floating-group">
          <input
            {...register('name', { required: 'Name is required' })}
            className="auth-floating-input"
            placeholder=" "
            autoFocus
            id="name"
          />
          <User size={16} className="auth-input-icon" />
          <label htmlFor="name" className="auth-floating-label">Full Name</label>
        </div>
        {errors.name && <p className="auth-error-msg">{errors.name.message}</p>}

        <div className="auth-floating-group">
          <input
            {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
            className="auth-floating-input"
            placeholder=" "
            type="email"
            id="email"
          />
          <Mail size={16} className="auth-input-icon" />
          <label htmlFor="email" className="auth-floating-label">Email Address</label>
        </div>
        {errors.email && <p className="auth-error-msg">{errors.email.message}</p>}

        <div className="auth-floating-group">
          <input
            {...register('password', { 
              required: 'Password required', 
              minLength: { value: 6, message: 'Min 6 characters' },
              validate: {
                uppercase: v => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
                number: v => /[0-9]/.test(v) || 'Must contain a number',
                special: v => /[^A-Za-z0-9]/.test(v) || 'Must contain a special character'
              }
            })}
            className="auth-floating-input"
            placeholder=" "
            type={showPass ? 'text' : 'password'}
            id="password"
          />
          <Lock size={16} className="auth-input-icon" />
          <label htmlFor="password" className="auth-floating-label">Password</label>
          <button type="button" onClick={() => setShowPass(!showPass)} className="auth-password-toggle">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="auth-error-msg">{errors.password.message}</p>}

        {/* Password Strength Meter */}
        {password.length > 0 && (
          <div className="auth-pw-meter-container">
            <div className="auth-pw-bars">
              <div className="auth-pw-bar" style={{ background: getMeterColor() }}></div>
              <div className="auth-pw-bar" style={{ background: strengthScore >= 2 ? getMeterColor() : 'var(--border)' }}></div>
              <div className="auth-pw-bar" style={{ background: strengthScore === 3 ? getMeterColor() : 'var(--border)' }}></div>
            </div>
            <div className="auth-pw-checks">
              <div className={`auth-pw-check ${hasUppercase ? 'passed' : ''}`}>
                <CheckCircle size={12} /> Uppercase letter
              </div>
              <div className={`auth-pw-check ${hasNumber ? 'passed' : ''}`}>
                <CheckCircle size={12} /> Number
              </div>
              <div className={`auth-pw-check ${hasSpecial ? 'passed' : ''}`}>
                <CheckCircle size={12} /> Special character
              </div>
            </div>
          </div>
        )}


        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
          <ArrowRight size={18} className="auth-btn-arrow" />
        </button>
      </form>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem' }}>
        Already have an account?{' '}
        <Link to="/login" className="auth-link">Sign In</Link>
      </p>
    </AuthLayout>
  );
}
