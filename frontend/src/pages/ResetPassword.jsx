import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function ResetPassword({ api }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);
  const emailFromQuery = useMemo(() => searchParams.get('email')?.trim() || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = token && emailFromQuery;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: emailFromQuery,
        token,
        password
      });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="panel w-full max-w-lg p-8 sm:p-10">
        <Link to="/" className="mb-8 inline-flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/20">
            <Brain size={28} className="text-white" />
          </div>
        </Link>
        <p className="text-sm font-bold uppercase tracking-wider text-brand">Account help</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">Set a new password</h1>
        <p className="mt-3 copy-muted">Choose a strong password you have not used here before.</p>

        {!canSubmit ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              This reset link is missing the token or email. Open the link from your email again, or request a new
              reset.
            </div>
            <Link to="/forgot-password" className="primary-btn inline-flex w-full justify-center">
              Request a new link
            </Link>
            <Link to="/login" className="secondary-btn inline-flex w-full justify-center">
              Back to log in
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label-text" htmlFor="reset-email">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                className="input-field opacity-90"
                value={emailFromQuery}
                readOnly
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label-text" htmlFor="reset-password">
                New password
              </label>
              <input
                id="reset-password"
                type="password"
                className="input-field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label-text" htmlFor="reset-confirm">
                Confirm password
              </label>
              <input
                id="reset-confirm"
                type="password"
                className="input-field"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repeat your new password"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
            ) : null}

            <button type="submit" className="primary-btn w-full" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-white/70">
          <Link to="/login" className="font-semibold text-brand">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
