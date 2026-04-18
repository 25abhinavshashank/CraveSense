function ProgressRing({ value }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value || 0));
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-28 w-28">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle
          cx="52"
          cy="52"
          r={radius}
          stroke="#2ed573"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold">{clamped}%</span>
        <span className="text-[11px] uppercase tracking-[0.22em] text-muted">resisted</span>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function PatternCard({ pattern }) {
  return (
    <section className="panel min-w-0 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h2 className="section-title">AI Pattern Report</h2>
          <p className="mt-1 copy-muted">A snapshot of the hours, triggers, and diet days that need extra attention.</p>
        </div>
        <ProgressRing value={pattern?.resistanceRate || 0} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <DetailRow label="Top trigger" value={pattern?.topTrigger || 'Unknown'} />
        <DetailRow label="Danger hours" value={pattern?.dangerHoursDisplay || 'No danger windows yet'} />
        <DetailRow label="Danger diet days" value={pattern?.dangerDietDaysDisplay || 'No clear pattern yet'} />
        <DetailRow label="Most craved taste" value={pattern?.mostCravedTaste || 'Unknown'} />
      </div>

      <blockquote className="mt-6 rounded-3xl border border-brand/20 bg-brand/10 p-5 text-sm leading-7 text-white/85">
        "{pattern?.personalInsight || 'As more cravings are logged, your personal insight will get sharper.'}"
      </blockquote>

      <div className="mt-4 rounded-3xl border border-success/25 bg-success/10 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-success">Top recommendation</p>
        <p className="mt-3 text-sm leading-7 text-white/85">
          {pattern?.topRecommendation || 'Keep logging cravings and your best next move will show up here.'}
        </p>
      </div>
    </section>
  );
}
