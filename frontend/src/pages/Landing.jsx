import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Catch your danger windows',
    description: 'CraveSense maps the hours and triggers where your diet usually slips, then turns that pattern into clear warnings.'
  },
  {
    title: 'Intervene in the moment',
    description: 'The Chrome extension interrupts cravings with a fast coaching flow, a timed challenge, and smart low-calorie backup options.'
  },
  {
    title: 'Track calories and macros in one place',
    description: 'Log meals, watch macro rings update live, and keep your craving data next to your nutrition targets.'
  }
];

export default function Landing({ user }) {
  return (
    <div className="px-6 pb-16 pt-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div>
          <p className="font-display text-2xl font-semibold">CraveSense</p>
          <p className="mt-1 text-sm text-muted">Craving intelligence for staying in your calorie deficit.</p>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="primary-btn">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="secondary-btn">
                Log In
              </Link>
              <Link to="/register" className="primary-btn">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto mt-14 grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="panel overflow-hidden p-8 sm:p-10">
          <p className="inline-flex rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">
            AI craving coach + diet dashboard
          </p>
          <h1 className="mt-8 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            See your cravings before they hit and stay in control when they do.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/75">
            CraveSense helps you resist impulsive eating with pattern analysis, real-time coaching, and a clean nutrition dashboard that keeps your deficit visible.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={user ? '/dashboard' : '/register'} className="primary-btn">
              {user ? 'Go to Dashboard' : 'Build My Streak'}
            </Link>
            <a href="#features" className="secondary-btn">
              Explore Features
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted">Resistance Rate</p>
              <p className="mt-3 font-display text-3xl font-semibold">Live</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted">Extension Flow</p>
              <p className="mt-3 font-display text-3xl font-semibold">5 Steps</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted">Macro Tracking</p>
              <p className="mt-3 font-display text-3xl font-semibold">Daily</p>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-warning">How it works</p>
            <ol className="mt-5 space-y-4 text-sm leading-7 text-white/80">
              <li>1. Log the craving or urge in the extension.</li>
              <li>2. Get a targeted motivational message plus a 10-minute challenge.</li>
              <li>3. If the craving stays, choose a smart low-calorie option that fits your taste.</li>
              <li>4. Watch the dashboard learn your break times, triggers, and weekly trend.</li>
            </ol>
          </div>

          <div className="panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-danger">Built for real life</p>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Late-night snacking, boredom eating, stress spirals, habit cravings after work - CraveSense keeps the data honest and the feedback useful.
            </p>
          </div>
        </aside>
      </main>

      <section id="features" className="mx-auto mt-16 max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand">Feature Set</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">Everything focused on craving management</h2>
          </div>
          {!user && (
            <Link to="/register" className="secondary-btn">
              Create Account
            </Link>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="panel p-6">
              <h3 className="font-display text-2xl font-semibold">{feature.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/75">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
