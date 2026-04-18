export default function DangerZoneAlert({ active, message, onDismiss }) {
  if (!active) {
    return null;
  }

  return (
    <div className="panel border-danger/40 bg-danger/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-danger">Danger Zone Active</p>
          <p className="mt-2 text-sm leading-7 text-white/80">{message}</p>
        </div>
        <button type="button" onClick={onDismiss} className="secondary-btn shrink-0">
          Dismiss
        </button>
      </div>
    </div>
  );
}
