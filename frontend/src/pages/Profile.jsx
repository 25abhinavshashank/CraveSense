import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CravingHeatmap from '../components/CravingHeatmap';
import PatternCard from '../components/PatternCard';
import ProgressStats from '../components/ProgressStats';

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function Profile({ api, user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [pattern, setPattern] = useState(null);
  const [stats, setStats] = useState(null);

  const recentCravings = useMemo(() => history.slice(0, 12), [history]);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      setError('');

      try {
        const [historyResponse, patternResponse, statsResponse] = await Promise.all([
          api.get('/craving/history?days=30'),
          api.get('/pattern/analyze'),
          api.get('/pattern/stats')
        ]);

        setHistory(historyResponse.data.logs || []);
        setPattern(patternResponse.data);
        setStats(statsResponse.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load your insights right now.');
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [api]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 sm:px-8 lg:px-10">
        <div className="panel w-full max-w-md p-10 text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
          <h1 className="font-display text-2xl font-semibold">Loading insights</h1>
          <p className="mt-3 copy-muted">Pulling your weekly trend and craving calendar together.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-12 pt-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="panel relative overflow-hidden p-4 sm:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-success/10 blur-3xl" />

          <p className="text-xs uppercase tracking-[0.28em] text-brand">Profile</p>
          <h1 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
            {user?.name || 'Your'} insights & trends
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75 sm:leading-7">
            This page keeps the dashboard clean—weekly progress, your craving calendar, and the AI pattern report all live here.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/dashboard" className="secondary-btn w-full text-center sm:w-auto">
              Back to Dashboard
            </Link>
            <Link to="/food-log" className="primary-btn w-full text-center sm:w-auto">
              Log Food
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
        ) : null}

        <ProgressStats stats={stats} caloriesRemaining={0} />

        <div className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <PatternCard pattern={pattern} />

          <section className="panel min-w-0 p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <h2 className="section-title">Recent Craving Log</h2>
                <p className="mt-1 copy-muted">The latest 12 entries across the last 30 days.</p>
              </div>
              <p className="shrink-0 text-sm text-muted">{recentCravings.length} entries</p>
            </div>

            <div className="mt-6 space-y-3 md:hidden">
              {recentCravings.map((log) => (
                <article
                  key={log._id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/85"
                >
                  <p className="font-medium text-white">{formatDateTime(log.timestamp)}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm">
                    <div>
                      <dt className="text-muted">Type</dt>
                      <dd className="mt-0.5 capitalize">{log.tasteType || log.hungerType}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Trigger</dt>
                      <dd className="mt-0.5 capitalize">{String(log.trigger || 'other').replace('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Intensity</dt>
                      <dd className="mt-0.5">{log.intensity}/10</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Calories</dt>
                      <dd className="mt-0.5">{Math.round(log.caloriesConsumed || 0)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted">Outcome</dt>
                      <dd className="mt-0.5 capitalize">{String(log.outcome || '—').replace(/_/g, ' ')}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="min-w-[640px] w-full divide-y divide-white/10 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.22em] text-muted">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Trigger</th>
                    <th className="pb-3">Intensity</th>
                    <th className="pb-3">Outcome</th>
                    <th className="pb-3">Calories</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentCravings.map((log) => (
                    <tr key={log._id}>
                      <td className="py-3 pr-4 text-white/80">{formatDateTime(log.timestamp)}</td>
                      <td className="py-3 pr-4 capitalize text-white/80">{log.tasteType || log.hungerType}</td>
                      <td className="py-3 pr-4 capitalize text-white/80">{String(log.trigger || 'other').replace('_', ' ')}</td>
                      <td className="py-3 pr-4 text-white/80">{log.intensity}/10</td>
                      <td className="py-3 pr-4 capitalize text-white/80">{String(log.outcome || '').replace(/_/g, ' ')}</td>
                      <td className="py-3 text-white/80">{Math.round(log.caloriesConsumed || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!recentCravings.length ? (
              <p className="mt-5 text-sm text-muted">No craving logs yet. Use the extension to start training the pattern engine.</p>
            ) : null}
          </section>
        </div>

        <CravingHeatmap logs={history} />
      </div>
    </div>
  );
}

