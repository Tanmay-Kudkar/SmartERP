import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../api/client';
import useStore from '../store/useStore';
import AuthLayout from '../components/AuthLayout';
import GoogleIcon from '../assets/google.svg';
import MicrosoftIcon from '../assets/microsoft.svg';

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setError, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/companies');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        setError('password', { type: 'manual', message: 'Invalid email or password' });
        setError('email', { type: 'manual', message: '' }); // highlight email too, but don't duplicate message
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sign in to continue to SmartERP</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-floating-group">
          <input
            {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
            className="auth-floating-input"
            placeholder=" "
            type="email"
            id="email"
            autoFocus
          />
          <Mail size={16} className="auth-input-icon" />
          <label htmlFor="email" className="auth-floating-label">Email Address</label>
        </div>
        {errors.email && <p className="auth-error-msg">{errors.email.message}</p>}

        <div className="auth-floating-group">
          <input
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
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

        <div className="auth-options">
          <label className="auth-checkbox-label">
            <input type="checkbox" className="auth-checkbox" {...register('remember')} />
            Remember me
          </label>
          <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); toast("Forgot Password flow not implemented yet", { icon: "ℹ️" }) }}>
            Forgot Password?
          </a>
        </div>

        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
          <ArrowRight size={18} className="auth-btn-arrow" />
        </button>
      </form>

      <div className="auth-divider">OR</div>

      <div className="auth-social-grid">
        <button className="auth-btn-social" onClick={() => toast("Google Login coming soon!", { icon: "🌐" })}>
          <img src={GoogleIcon} alt="Google" width="18" height="18" />
          Google
        </button>
        <button className="auth-btn-social" onClick={() => toast("Microsoft Login coming soon!", { icon: "🏢" })}>
          <img src={MicrosoftIcon} alt="Microsoft" width="18" height="18" />
          Microsoft
        </button>
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem' }}>
        Don&apos;t have an account?{' '}
        <Link to="/register" className="auth-link">Create Account</Link>
      </p>
    </AuthLayout>
  );
}
