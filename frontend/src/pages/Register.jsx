import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';

const defaultForm = {
  name: '',
  email: '',
  password: '',
  dailyCalorieGoal: 1500,
  dailyProteinGoal: 120,
  dailyCarbGoal: 160,
  dailyFatGoal: 50,
  fitnessGoal: 'fat_loss'
};

export default function Register({ api, onAuthSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        dailyCalorieGoal: Number(form.dailyCalorieGoal),
        dailyProteinGoal: Number(form.dailyProteinGoal),
        dailyCarbGoal: Number(form.dailyCarbGoal),
        dailyFatGoal: Number(form.dailyFatGoal)
      };

      const { data } = await api.post('/auth/register', payload);
      onAuthSuccess(data);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="panel w-full max-w-3xl p-8 sm:p-10">
        <Link to="/" className="inline-flex mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/20">
            <Brain size={28} className="text-white" />
          </div>
        </Link>
        <p className="text-sm font-bold uppercase tracking-wider text-brand">Start your plan</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">Create your account</h1>
        <p className="mt-3 copy-muted">Set your daily targets now so the coaching and dashboard feel personal from day one.</p>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="label-text" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="input-field"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Your name"
              required
            />
          </div>

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

          <div className="md:col-span-2">
            <label className="label-text" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Create a strong password"
              required
            />
          </div>

          <div>
            <label className="label-text" htmlFor="dailyCalorieGoal">
              Daily calorie goal
            </label>
            <input
              id="dailyCalorieGoal"
              type="number"
              className="input-field"
              min="500"
              value={form.dailyCalorieGoal}
              onChange={(event) => setForm((current) => ({ ...current, dailyCalorieGoal: event.target.value }))}
            />
          </div>

          <div>
            <label className="label-text" htmlFor="fitnessGoal">
              Fitness goal
            </label>
            <select
              id="fitnessGoal"
              className="input-field"
              value={form.fitnessGoal}
              onChange={(event) => setForm((current) => ({ ...current, fitnessGoal: event.target.value }))}
            >
              <option value="fat_loss">Fat Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="maintain">Maintain</option>
            </select>
          </div>

          <div>
            <label className="label-text" htmlFor="dailyProteinGoal">
              Protein goal (g)
            </label>
            <input
              id="dailyProteinGoal"
              type="number"
              className="input-field"
              min="0"
              value={form.dailyProteinGoal}
              onChange={(event) => setForm((current) => ({ ...current, dailyProteinGoal: event.target.value }))}
            />
          </div>

          <div>
            <label className="label-text" htmlFor="dailyCarbGoal">
              Carb goal (g)
            </label>
            <input
              id="dailyCarbGoal"
              type="number"
              className="input-field"
              min="0"
              value={form.dailyCarbGoal}
              onChange={(event) => setForm((current) => ({ ...current, dailyCarbGoal: event.target.value }))}
            />
          </div>

          <div>
            <label className="label-text" htmlFor="dailyFatGoal">
              Fat goal (g)
            </label>
            <input
              id="dailyFatGoal"
              type="number"
              className="input-field"
              min="0"
              value={form.dailyFatGoal}
              onChange={(event) => setForm((current) => ({ ...current, dailyFatGoal: event.target.value }))}
            />
          </div>

          {error ? (
            <div className="md:col-span-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-col gap-4 pt-2 sm:flex-row">
            <button type="submit" className="primary-btn flex-1" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <Link to="/login" className="secondary-btn flex-1">
              Already have an account?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
