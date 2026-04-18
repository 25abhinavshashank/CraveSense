function SummaryCard({ label, value, accent }) {
  return (
    <div className="panel min-w-0 p-4 sm:p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-4 font-display text-3xl font-semibold" style={{ color: accent || '#ffffff' }}>
        {value}
      </p>
    </div>
  );
}

export default function ProgressStats({ stats, caloriesRemaining }) {
  const weeklyProgress = stats?.weeklyProgress || [];
  const maxTotal = Math.max(
    1,
    ...weeklyProgress.map((day) => day.resisted + day.gaveIn + day.healthySwap)
  );

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Cravings logged today" value={stats?.today?.cravingsLogged || 0} />
        <SummaryCard label="Resisted today" value={stats?.today?.resisted || 0} accent="#2ed573" />
        <SummaryCard label="Calories remaining" value={Math.round(caloriesRemaining || 0)} accent="#6c63ff" />
        <SummaryCard label="Diet streak" value={`${stats?.dietStreak || 0} days`} accent="#ffa502" />
      </div>

      <div className="panel min-w-0 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Weekly Progress</h2>
            <p className="mt-1 copy-muted">Daily craving outcomes across the last 7 days.</p>
          </div>
          <p className="text-sm text-muted">
            Trend: <span className="font-semibold text-white">{stats?.weeklyComparison?.trend || 'stable'}</span>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-success" />
            Resisted
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-warning" />
            Healthy swap
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-danger" />
            Gave in
          </span>
        </div>

        <div className="mt-8 max-lg:-mx-1 max-lg:overflow-x-auto max-lg:pb-1 lg:mx-0">
          <div className="min-w-[520px] lg:min-w-0">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
          {weeklyProgress.map((day) => {
            const total = day.resisted + day.gaveIn + day.healthySwap;
            const resistedHeight = total ? (day.resisted / maxTotal) * 160 : 0;
            const swapHeight = total ? (day.healthySwap / maxTotal) * 160 : 0;
            const gaveInHeight = total ? (day.gaveIn / maxTotal) * 160 : 0;

            return (
              <div key={day.date} className="flex min-w-0 flex-col items-center">
                <div className="flex h-44 w-full items-end justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2 sm:rounded-3xl sm:p-3 md:h-48">
                  <div className="flex w-full flex-col justify-end gap-1">
                    <div className="rounded-t-xl bg-success" style={{ height: `${resistedHeight}px` }} />
                    <div className="bg-warning" style={{ height: `${swapHeight}px` }} />
                    <div className="rounded-b-xl bg-danger" style={{ height: `${gaveInHeight}px` }} />
                  </div>
                </div>
                <p className="mt-2 truncate text-center text-xs font-medium text-white sm:mt-3 sm:text-sm">{day.label}</p>
                <p className="mt-1 text-center text-[10px] text-muted sm:text-xs">{total} total</p>
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
