import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminLogin.css';

function AdminLogin() {
  const { login, token } = useAdminAuth();
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in → go to dashboard
  useEffect(() => {
    if (token) navigate('/admin/dashboard', { replace: true });
  }, [token, navigate]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-brand-mark">वि</div>
        <h1 className="login-brand-title">Vinay Kulkarni</h1>
        <p className="login-brand-sub">Content Management System</p>
        <div className="login-decorative-line" />
        <p className="login-tagline">
          Dharayati Iti Dharmaha
        </p>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={submit} noValidate>
          <div className="login-card-header">
            <span className="login-eyebrow">CMS Admin</span>
            <h2 className="login-heading">Sign in</h2>
            <p className="login-sub">Enter your credentials to access the dashboard</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">⚠</span>
              {error}
            </div>
          )}

          <div className="login-field">
            <label className="login-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="login-input"
              type="text"
              name="username"
              value={form.username}
              onChange={handle}
              autoComplete="username"
              autoFocus
              required
              placeholder="admin"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="login-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handle}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <a href="/" className="login-back-link">← Back to website</a>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
