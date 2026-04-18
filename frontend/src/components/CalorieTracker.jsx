import { NavLink } from "react-router-dom";

export default function CalorieTracker({ consumed = 0, goal = 1500 }) {
  const progress = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - consumed);
// function getNavClassName(isActive) {
//   return [
//     ' transition',
//     isActive
//       ? 
//       : 
//   ].join(' ');
// }
  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-muted">Daily calories</p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {Math.round(consumed)} / {goal} cal
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">Remaining</p>
          <p className="mt-2 text-xl font-semibold text-success">{remaining} cal</p>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${progress >= 95 ? 'bg-danger' : progress >= 75 ? 'bg-warning' : 'bg-brand'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-3 mb-8 text-sm text-muted">{progress}% of your calorie goal used today.</p>

      <NavLink to="/food-log" className='rounded-full text-lg px-4 py-2  font-semibold bg-brand text-white shadow-[0_10px_30px_rgba(108,99,255,0.35)]'>
                  Log Food 
      </NavLink>
    </div>
  );
}
