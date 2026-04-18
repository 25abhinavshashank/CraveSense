import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Brain } from 'lucide-react';

function getNavClassName(isActive) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-brand text-white shadow-[0_10px_30px_rgba(108,99,255,0.35)]'
      : 'bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
  ].join(' ');
}

function getInitials(name) {
  if (!name) {
    return 'U';
  }

  const tokens = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return 'U';
  }

  const first = tokens[0]?.[0] ?? '';
  const last = tokens.length > 1 ? tokens[tokens.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase() || 'U';
}

export default function AppHeader({ user, onLogout }) {
  const consumed = Math.round(user?.caloriesConsumedToday || 0);
  const goal = Math.max(1, user?.dailyCalorieGoal || 1500);
  const progress = Math.min(100, Math.round((consumed / goal) * 100));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current) {
        return;
      }
      if (menuRef.current.contains(event.target)) {
        return;
      }
      setMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-[1350px] px-4 py-3 sm:px-8 lg:px-10">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-10 -top-2 hidden h-12 rounded-3xl bg-brand/10 blur-2xl md:block" />
          <div className="panel rounded-[28px] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
              <div className="min-w-0">
                <NavLink to="/dashboard" className="flex items-center gap-3 group transition-opacity hover:opacity-80">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20">
                    <Brain size={20} />
                  </div>
                  <p className="truncate font-display text-xl font-bold leading-tight md:text-xl">CraveSense</p>
                </NavLink>
            
              </div>

              <div className="flex items-center gap-2">


                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen((value) => !value);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-2 transition hover:bg-white/10"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/20 font-display text-sm font-semibold text-white ring-1 ring-white/10">
                      {initials}
                    </span>
                    <span className="hidden text-left sm:block">
                      <span className="block max-w-[140px] truncate text-sm font-semibold leading-tight text-white">
                        {user?.name || 'User'}
                      </span>
                      <span className="block text-xs text-muted">Account</span>
                    </span>
                    <span className="hidden text-xs text-white/70 sm:inline">▾</span>
                  </button>

                  {menuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-3 w-[min(92vw,320px)] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b12]/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                    >
                      <div className="px-5 py-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted">Signed in as</p>
                        <p className="mt-2 font-display text-lg font-semibold text-white">{user?.name || 'User'}</p>
                        <p className="mt-1 text-sm text-white/70">{consumed} / {goal} calories today</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="border-t border-white/10 px-3 py-3 md:hidden">
                        <div className="grid gap-2">
                          <NavLink
                            to="/dashboard"
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                              [
                                'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                                isActive
                                  ? 'border-brand bg-brand/15 text-white'
                                  : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                              ].join(' ')
                            }
                          >
                            Dashboard
                          </NavLink>
                          <NavLink
                            to="/food-log"
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                              [
                                'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                                isActive
                                  ? 'border-brand bg-brand/15 text-white'
                                  : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                              ].join(' ')
                            }
                          >
                            Food Log
                          </NavLink>
                          <NavLink
                            to="/profile"
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                              [
                                'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                                isActive
                                  ? 'border-brand bg-brand/15 text-white'
                                  : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                              ].join(' ')
                            }
                          >
                            Profile
                          </NavLink>
                          <NavLink
                            to="/settings"
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                              [
                                'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                                isActive
                                  ? 'border-brand bg-brand/15 text-white'
                                  : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                              ].join(' ')
                            }
                          >
                            Settings
                          </NavLink>
                        </div>
                      </div>

                      <div className="border-t border-white/10 px-2 py-2">
                        <NavLink
                          to="/profile"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="hidden rounded-2xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white md:block"
                        >
                          Profile
                        </NavLink>
                        <NavLink
                          to="/settings"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="hidden rounded-2xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white md:block"
                        >
                          Settings
                        </NavLink>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false);
                            onLogout?.();
                          }}
                          className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold text-danger transition hover:bg-danger/10"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* <div className="hidden border-t border-white/10 px-4 py-3 md:block">
              <nav className="flex flex-wrap gap-2">
                <NavLink to="/dashboard" className={({ isActive }) => getNavClassName(isActive)}>
                  Dashboard
                </NavLink>
                <NavLink to="/food-log" className={({ isActive }) => getNavClassName(isActive)}>
                  Food Log
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => getNavClassName(isActive)}>
                  Settings
                </NavLink>
              </nav>
            </div> */}

          </div>
        </div>
      </div>
    </header>
  );
}
