const FITNESS_GOALS = [
  { value: 'fat_loss', label: 'Fat Loss', description: 'Lower calories and stay tight on cravings.' },
  { value: 'muscle_gain', label: 'Muscle Gain', description: 'Support training while keeping food quality high.' },
  { value: 'maintain', label: 'Maintain', description: 'Hold steady with balanced calories and macros.' }
];

export default function ProfileTargetsForm({ form, onChange, onSubmit, saving, message }) {
  const updateField = (field, value) => {
    onChange((current) => ({
      ...current,
      [field]: value
    }));
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <h2 className="section-title">Goals & Targets</h2>
        <p className="mt-1 copy-muted">Choose the plan style that matches your goal, then adjust the exact numbers below.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {FITNESS_GOALS.map((goal) => {
          const active = form.fitnessGoal === goal.value;
          return (
            <button
              key={goal.value}
              type="button"
              onClick={() => updateField('fitnessGoal', goal.value)}
              className={`rounded-3xl border p-5 text-left transition ${
                active
                  ? 'border-brand bg-brand/12 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <p className="font-display text-xl font-semibold">{goal.label}</p>
              <p className="mt-2 text-sm leading-7 text-white/70">{goal.description}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label-text">Daily calorie goal</label>
          <input
            className="input-field"
            type="number"
            min="500"
            value={form.dailyCalorieGoal}
            onChange={(event) => updateField('dailyCalorieGoal', event.target.value)}
          />
        </div>
        <div>
          <label className="label-text">Protein goal (g)</label>
          <input
            className="input-field"
            type="number"
            min="0"
            value={form.dailyProteinGoal}
            onChange={(event) => updateField('dailyProteinGoal', event.target.value)}
          />
        </div>
        <div>
          <label className="label-text">Carb goal (g)</label>
          <input
            className="input-field"
            type="number"
            min="0"
            value={form.dailyCarbGoal}
            onChange={(event) => updateField('dailyCarbGoal', event.target.value)}
          />
        </div>
        <div>
          <label className="label-text">Fat goal (g)</label>
          <input
            className="input-field"
            type="number"
            min="0"
            value={form.dailyFatGoal}
            onChange={(event) => updateField('dailyFatGoal', event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Targets'}
        </button>
        {message ? <p className="text-sm text-white/75">{message}</p> : null}
      </div>
    </form>
  );
}
