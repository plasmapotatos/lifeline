import type { Ambulance, Event } from "../../types";

type EventDrawerProps = {
  event: Event;
  ambulances: Ambulance[];
};

/**
 * Drawer content for an emergency event.
 */
export default function EventDrawer({ event, ambulances }: EventDrawerProps) {
  const assigned = ambulances.find(
    (ambulance) => String(ambulance.id) === String(event.ambulance_id),
  );
  const etaMinutes = assigned
    ? Math.max(1, Math.round(assigned.eta_seconds / 60))
    : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold">{event.title}</p>
        <p className="text-sm text-slate-400">{event.description}</p>
      </div>
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Severity</span>
          <span className="rounded-full bg-red-500/20 px-2 py-1 text-red-200">
            {event.severity}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Ambulance ETA</span>
          <span className="text-cyan-200">
            {etaMinutes ? `${etaMinutes} min` : "—"}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Reference frame and AI assessment embedded below.
        </div>
      </div>
      <img
        src={event.reference_clip_url}
        alt="AI reference frame"
        className="w-full rounded-2xl border border-white/10"
      />
    </div>
  );
}
