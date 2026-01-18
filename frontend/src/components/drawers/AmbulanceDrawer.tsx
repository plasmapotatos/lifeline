import { useEvents } from "../../hooks/api.ts";
import type { Ambulance } from "../../types";
import { type Event } from "../../types";

type AmbulanceDrawerProps = {
  ambulance: Ambulance;
};

/**
 * Drawer content for an ambulance unit.
 */
export default function AmbulanceDrawer({ ambulance }: AmbulanceDrawerProps) {
  // Convert seconds to MM:SS format
  const etaFormatted = ambulance.eta_seconds
    ? `${Math.floor(ambulance.eta_seconds / 60)
        .toString()
        .padStart(1, "0")}:${Math.floor(ambulance.eta_seconds % 60)
        .toString()
        .padStart(2, "0")}`
    : null;

  const { data: events } = useEvents();
  const event = events.find(
    (e: Event) => String(e._id) === String(ambulance.event_id),
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold">Ambulance {ambulance.name}</p>
        <p className="text-xs text-slate-400">ETA: {etaFormatted ?? "—"}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
        <p className="text-slate-400">Assigned Event</p>
        <p>{event ? event.title : "Awaiting dispatch"}</p>
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
