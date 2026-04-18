import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CalorieTracker from '../components/CalorieTracker';
import DangerZoneAlert from '../components/DangerZoneAlert';
import MacroRings from '../components/MacroRings';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

export default function Dashboard({ api, user, onUserUpdate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dangerZone, setDangerZone] = useState(null);
  const [foodSummary, setFoodSummary] = useState(null);
  const [dangerDismissed, setDangerDismissed] = useState(false);

  const syncUserCalories = (summaryPayload) => {
    if (!summaryPayload) {
      return;
    }

    onUserUpdate((currentUser) => ({
      ...currentUser,
      caloriesConsumedToday: Math.round(summaryPayload.caloriesConsumed || 0)
    }));
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        dangerResponse,
        foodSummaryResponse
      ] = await Promise.all([
        api.get('/pattern/danger-zone'),
        api.get('/food/summary')
      ]);

      setDangerZone(dangerResponse.data);
      setFoodSummary(foodSummaryResponse.data);
      syncUserCalories(foodSummaryResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your dashboard right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const registerPush = async () => {
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            return;
          }
        }

        if (Notification.permission !== 'granted') {
          return;
        }

        const existingSubscription = await registration.pushManager.getSubscription();
        const subscription =
          existingSubscription ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          }));

        await api.post('/notification/subscribe', subscription.toJSON());
      } catch (pushError) {
        console.warn('Push registration failed:', pushError);
      }
    };

    if (!loading) {
      registerPush();
    }
  }, [api, loading]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 sm:px-8 lg:px-10">
        <div className="panel w-full max-w-md p-10 text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
          <h1 className="font-display text-2xl font-semibold">Loading your dashboard</h1>
          <p className="mt-3 copy-muted">Pulling cravings, macros, and pattern insights together.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-12 pt-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="grid gap-5 xl:grid-cols-[1fr_360px] ">
          <section className="panel relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-danger/10 blur-3xl" />

            <p className="text-xs uppercase tracking-[0.28em] text-brand">Dashboard</p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Hi {user.name}, let&apos;s keep your day on track.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
              Everything you need at a glance—calories, macros, craving patterns, and a quick path to log food or adjust targets.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/food-log" className="primary-btn">
                Open Food Log
              </Link>
              <Link to="/settings" className="secondary-btn">
                Change Targets
              </Link>
            </div>
          </section>

          <CalorieTracker consumed={foodSummary?.caloriesConsumed || user.caloriesConsumedToday || 0} goal={user.dailyCalorieGoal} />
        </header>

        <DangerZoneAlert
          active={Boolean(dangerZone?.currentHourInDangerZone) && !dangerDismissed}
          message={dangerZone?.warningMessage || 'Your usual danger window is active right now.'}
          onDismiss={() => setDangerDismissed(true)}
        />

        {error ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
        ) : null}

        <section className="h-full">
          <MacroRings summary={foodSummary} />
        </section>

        <section className="panel p-6">
          <h2 className="section-title">Quick Actions & Status</h2>
          <p className="mt-1 copy-muted">Everything you need to manage your day, all in one row.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/profile" className="flex flex-col rounded-3xl border border-brand/20 bg-brand/10 p-6 transition hover:border-brand/40 hover:bg-brand/15">
              <p className="text-xs uppercase tracking-[0.22em] text-brand">Insights</p>
              <p className="mt-3 font-display text-xl font-semibold">Pattern Report</p>
              <p className="mt-2 text-sm leading-6 text-white/70 flex-1">
                Trends, weekly progress, and your 30-day craving heatmap.
              </p>
              <span className="mt-4 text-xs font-bold text-brand uppercase tracking-widest">View Report →</span>
            </Link>

            <Link to="/food-log" className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-brand/40 hover:bg-white/[0.05]">
              <p className="text-xs uppercase tracking-[0.22em] text-muted font-semibold">Tracking</p>
              <p className="mt-3 font-display text-xl font-semibold">Food Log</p>
              <p className="mt-2 text-sm leading-6 text-white/70 flex-1">Search food entries and adjust your daily calorie intake.</p>
              <span className="mt-4 text-xs font-bold text-white/40 uppercase tracking-widest">Open Log →</span>
            </Link>

            <Link to="/settings" className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-brand/40 hover:bg-white/[0.05]">
              <p className="text-xs uppercase tracking-[0.22em] text-muted font-semibold">Prefs</p>
              <p className="mt-3 font-display text-xl font-semibold">Settings</p>
              <p className="mt-2 text-sm leading-6 text-white/70 flex-1">Change calorie targets, protein goals, and fitness metrics.</p>
              <span className="mt-4 text-xs font-bold text-white/40 uppercase tracking-widest">Adjust →</span>
            </Link>

            <div className="flex flex-col rounded-3xl border border-warning/20 bg-warning/10 p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-warning font-semibold">Status</p>
              <p className="mt-3 font-display text-xl font-semibold text-warning">Danger Windows</p>
              <p className="mt-2 text-sm leading-6 text-white/80 flex-1">
                {dangerZone?.dangerHours?.length
                  ? dangerZone.dangerHours.map((entry) => entry.label).join(', ')
                  : 'No danger windows identified yet.'}
              </p>
              <span className="mt-4 text-xs font-bold text-warning/60 uppercase tracking-widest">Live Updates</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
