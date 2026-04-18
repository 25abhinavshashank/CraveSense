import { useEffect, useState } from 'react';
import ProfileTargetsForm from '../components/ProfileTargetsForm';

export default function Settings({ api, user, onUserUpdate }) {
  const [form, setForm] = useState({
    dailyCalorieGoal: user.dailyCalorieGoal,
    dailyProteinGoal: user.dailyProteinGoal,
    dailyCarbGoal: user.dailyCarbGoal,
    dailyFatGoal: user.dailyFatGoal,
    fitnessGoal: user.fitnessGoal
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      dailyCalorieGoal: user.dailyCalorieGoal,
      dailyProteinGoal: user.dailyProteinGoal,
      dailyCarbGoal: user.dailyCarbGoal,
      dailyFatGoal: user.dailyFatGoal,
      fitnessGoal: user.fitnessGoal
    });
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload = {
        dailyCalorieGoal: Number(form.dailyCalorieGoal),
        dailyProteinGoal: Number(form.dailyProteinGoal),
        dailyCarbGoal: Number(form.dailyCarbGoal),
        dailyFatGoal: Number(form.dailyFatGoal),
        fitnessGoal: form.fitnessGoal
      };

      const { data } = await api.put('/auth/profile', payload);
      onUserUpdate(data.user);
      setMessage('Your targets have been updated.');
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Could not save your targets right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pb-10 pt-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="panel p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-brand">Settings</p>
            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Change your targets without digging through the dashboard.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
              This page is just for calories, macros, and fitness goal changes, so it is easier to tune your plan whenever your routine changes.
            </p>
          </section>

          <section className="panel p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Current setup</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-muted">Daily calories</p>
                <p className="mt-2 font-display text-4xl font-semibold">{user.dailyCalorieGoal}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm text-muted">Protein</p>
                  <p className="mt-2 font-display text-2xl font-semibold">{user.dailyProteinGoal}g</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm text-muted">Carbs</p>
                  <p className="mt-2 font-display text-2xl font-semibold">{user.dailyCarbGoal}g</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm text-muted">Fat</p>
                  <p className="mt-2 font-display text-2xl font-semibold">{user.dailyFatGoal}g</p>
                </div>
              </div>
              <div className="rounded-3xl border border-brand/20 bg-brand/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-brand">Fitness goal</p>
                <p className="mt-2 font-display text-2xl font-semibold capitalize">
                  {String(user.fitnessGoal || 'fat_loss').replace('_', ' ')}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="panel p-6">
          <ProfileTargetsForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            saving={saving}
            message={message}
          />
        </section>
      </div>
    </div>
  );
}
