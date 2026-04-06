// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const getPasswordStrength = (password) => {
  if (!password) {
    return { score: 0, label: 'Add at least 6 characters', color: 'bg-gray-600', text: 'text-muted' };
  }

  const checks = [
    password.length >= 6,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (score <= 1) return { score, label: 'Too weak', color: 'bg-red-500', text: 'text-red-400' };
  if (score === 2) return { score, label: 'Okay', color: 'bg-amber-500', text: 'text-amber-400' };
  if (score === 3) return { score, label: 'Strong', color: 'bg-primary', text: 'text-primary' };
  return { score, label: 'Very strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { username, email, password } = formData;
      const { data } = await register({ username, email, password });
      setAuth(data.user, data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-root p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="premium-card p-10 rounded-[2rem] shadow-2xl border border-border">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center justify-center gap-2 text-main font-bold text-2xl mb-4 hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #6C63FF)" strokeWidth="2.5" className="w-8 h-8">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </Link>
            <h1 className="font-display text-3xl font-bold text-main tracking-tight">Create an account</h1>
            <p className="text-muted text-sm mt-2">Join LiveCollab and start creating together</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-[0.1em] ml-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface text-sm border border-border rounded-xl text-main placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-inner"
                  placeholder="CreativeGenius"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-[0.1em] ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface text-sm border border-border rounded-xl text-main placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-inner"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-[0.1em] ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3.5 bg-surface text-sm border border-border rounded-xl text-main placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-inner"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-main transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="space-y-2 rounded-xl border border-border bg-surface/60 p-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-muted">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Password strength
                  </span>
                  <span className={passwordStrength.text}>{passwordStrength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={`h-1.5 rounded-full transition-colors ${passwordStrength.score >= step ? passwordStrength.color : 'bg-gray-700'}`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted">Use at least 6 characters. Add uppercase, numbers, or symbols to make it stronger.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-[0.1em] ml-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3.5 bg-surface text-sm border border-border rounded-xl text-main placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-inner"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(value => !value)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-main transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`text-xs font-semibold ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">
              Log in here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
