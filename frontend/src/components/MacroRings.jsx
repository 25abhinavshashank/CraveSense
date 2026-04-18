const MACROS = [
  { key: 'protein', label: 'Protein', color: '#6c63ff', goalKey: 'proteinGoal', unit: 'g' },
  { key: 'carbs', label: 'Carbs', color: '#ffa502', goalKey: 'carbGoal', unit: 'g' },
  { key: 'fat', label: 'Fat', color: '#ff4757', goalKey: 'fatGoal', unit: 'g' }
];

function MacroRing({ label, color, currentValue, goalValue, unit }) {
  const progress = goalValue > 0 ? Math.min(100, Math.round((currentValue / goalValue) * 100)) : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-16 w-16 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[10px] sm:text-base lg:text-xl font-bold">{progress}%</span>
        </div>
      </div>
      <p className="mt-3 font-display text-xs sm:text-sm lg:text-base font-semibold text-white/90">{label}</p>
      <p className="mt-1 text-[10px] sm:text-xs text-muted">
        {Math.round(currentValue)}{unit}
      </p>
    </div>
  );
}

export default function MacroRings({ summary }) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="section-title text-lg sm:text-xl">Daily Macros</h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">Real-time target tracking.</p>
      </div>

      <div className="flex items-center justify-around gap-2 sm:gap-6">
        {MACROS.map((macro) => (
          <MacroRing
            key={macro.key}
            label={macro.label}
            color={macro.color}
            currentValue={summary?.[macro.key] || 0}
            goalValue={summary?.[macro.goalKey] || 0}
            unit={macro.unit}
          />
        ))}
      </div>
    </section>
  );
}
