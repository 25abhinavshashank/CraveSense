const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getCellColor(intensity) {
  if (!intensity || intensity <= 0) {
    return 'rgba(255,255,255,0.03)';
  }

  // Improved alpha range for much better contrast
  const alpha = 0.1 + intensity * 0.9;
  return `rgba(108, 99, 255, ${alpha})`;
}

export default function CravingHeatmap({ logs = [] }) {
  const counts = DAYS.reduce((accumulator, day) => {
    accumulator[day] = Array.from({ length: 24 }, () => 0);
    return accumulator;
  }, {});

  logs.forEach((log) => {
    const day = log.dayOfWeek;
    const hour = Number(log.hourOfDay);
    if (counts[day] && Number.isInteger(hour) && hour >= 0 && hour <= 23) {
      counts[day][hour] += 1;
    }
  });

  const maxCount = Math.max(1, ...Object.values(counts).flat());

  return (
    <section className="panel p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">When your cravings hit</h2>
          <p className="mt-1 copy-muted">Higher frequency hours appear darker and more vibrant.</p>
        </div>
        <p className="text-sm text-muted">Aggregated Pattern (Last 30 Days)</p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[860px] grid-cols-[120px_repeat(24,minmax(24px,1fr))] gap-2 text-xs text-muted">
          <div />
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="text-center font-medium">
              {hour}h
            </div>
          ))}

          {DAYS.map((day) => (
            <div key={day} className="contents">
              <div className="flex items-center text-sm font-medium text-white/80">{day}</div>
              {counts[day].map((count, hour) => (
                <div
                  key={`${day}-${hour}`}
                  className="relative h-9 rounded-md border border-white/5 transition-all hover:scale-110 hover:z-10"
                  style={{ backgroundColor: getCellColor(count / maxCount) }}
                  title={`${day} at ${hour}:00 — ${count} craving logs`}
                >
                  {count > 0 ? (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                      {count}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
        <span>Less Cravings</span>
        {[0, 0.25, 0.5, 0.75, 1].map((level) => (
          <div
            key={level}
            className="h-3 w-3 rounded-sm border border-white/5"
            style={{ backgroundColor: getCellColor(level) }}
          />
        ))}
        <span>More Cravings</span>
      </div>
    </section>
  );
}
