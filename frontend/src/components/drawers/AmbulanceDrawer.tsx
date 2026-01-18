import type { Ambulance } from "../../types";

type AmbulanceDrawerProps = {
  ambulance: Ambulance;
};

/**
 * Drawer content for an ambulance unit.
 */
export default function AmbulanceDrawer({ ambulance }: AmbulanceDrawerProps) {
  const etaMinutes = ambulance.eta_seconds
    ? Math.max(1, Math.round(ambulance.eta_seconds / 60))
    : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold">Ambulance {ambulance.id}</p>
        <p className="text-xs text-slate-400">
          ETA: {etaMinutes ? `${etaMinutes} min` : "—"}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
        <p className="text-slate-400">Assigned Event</p>
        <p>{ambulance.event_id ?? "Awaiting dispatch"}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
        <p className="text-slate-400">Location</p>
        <p>
          {ambulance.lat.toFixed(4)},{ambulance.lng.toFixed(4)}
        </p>
      </div>
    </div>
  );
}
