// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { register } from '../api/authApi';
import { useToast } from '../components/common/Toast';
import '../styles/auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth, user } = useAuthStore();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.username.trim()) {
      errs.username = 'Username is required';
    } else if (form.username.trim().length < 2) {
      errs.username = 'Username must be at least 2 characters';
    } else if (form.username.trim().length > 30) {
      errs.username = 'Username must be 30 characters or fewer';
    }
    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  // Password strength
  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabel = ['', 'weak', 'medium', 'medium', 'strong'][strength] || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const { data } = await register({
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
      });
      setAuth(data.user, data.accessToken);
      toast.success('Account created!', 'Welcome to LiveCollab');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout bg-grid">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="auth-logo-text">LiveCollab</span>
          </div>

          {/* Header */}
          <div className="auth-header">
            <h1>Create your account</h1>
            <p>Join the collaboration — it takes 30 seconds</p>
          </div>

          {/* Error */}
          {apiError && (
            <div className="auth-error">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="register-email">Email address</label>
              <div className="input-wrapper">
                <input
                  id="register-email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                />
                <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="register-username">Username</label>
              <div className="input-wrapper">
                <input
                  id="register-username"
                  className={`input ${errors.username ? 'input-error' : ''}`}
                  type="text"
                  name="username"
                  placeholder="alice_designs"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
                <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="register-password">Password</label>
              <div className="input-wrapper">
                <input
                  id="register-password"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
              {form.password && (
                <div className="password-strength">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`password-strength-bar ${i <= strength ? `active ${strengthLabel}` : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit w-full"
              disabled={loading}
              id="register-submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
