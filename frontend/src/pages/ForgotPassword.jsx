import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function ForgotPassword({ api }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setDone(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send reset instructions right now.');
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
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">Forgot password</h1>
        <p className="mt-3 copy-muted">
          Enter the email you use for CraveSense. If an account exists, we will send reset instructions.
        </p>

        {done ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              If an account exists for that email, you will receive password reset instructions shortly. Check your
              inbox and spam folder.
            </div>
            <Link to="/login" className="primary-btn inline-flex w-full justify-center">
              Back to log in
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label-text" htmlFor="forgot-email">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                className="input-field"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
            ) : null}

            <button type="submit" className="primary-btn w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-white/70">
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
