import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function Login({ api, onAuthSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const passwordResetBanner = location.state?.passwordReset;
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', form);
      onAuthSuccess(data);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to log in right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="panel w-full max-w-lg p-8 sm:p-10">
        <Link to="/" className="inline-flex mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/20">
            <Brain size={28} className="text-white" />
          </div>
        </Link>
        <p className="text-sm font-bold uppercase tracking-wider text-brand">Welcome back</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">Log in</h1>
        <p className="mt-3 copy-muted">Pick up your dashboard, danger zones, and streak where you left off.</p>

        {passwordResetBanner ? (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            Password updated. You can log in with your new password.
          </div>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="label-text" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="label-text mb-0" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="shrink-0 text-sm font-semibold text-brand hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="input-field"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter your password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          ) : null}

          <button type="submit" className="primary-btn w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-sm text-white/70">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand">
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
