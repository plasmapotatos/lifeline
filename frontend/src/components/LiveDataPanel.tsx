import { useAmbulances, useCameras, useEvents } from "../hooks/api";

/**
 * Example component that renders live ambulances, events, and cameras.
 */
export default function LiveDataPanel() {
  const { data: ambulances } = useAmbulances();
  const { data: events } = useEvents();
  const { data: cameras } = useCameras();

  return (
    <div className="pointer-events-auto absolute left-6 bottom-6 z-20 w-72 rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200 shadow-xl backdrop-blur">
      <h3 className="mb-2 text-sm font-semibold text-white">Live Feed</h3>
      <div className="space-y-2">
        <div>
          <p className="text-slate-400">Ambulances</p>
          <ul className="space-y-1">
            {ambulances.slice(0, 3).map((unit) => (
              <li key={unit.id} className="flex justify-between">
                <span>Unit {unit.id}</span>
                <span className="text-slate-400">
                  {unit.lat.toFixed(3)}, {unit.lng.toFixed(3)}
                </span>
              </li>
            ))}
            {ambulances.length === 0 && (
              <li className="text-slate-500">No ambulances.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-slate-400">Events</p>
          <ul className="space-y-1">
            {events.slice(0, 3).map((event) => (
              <li key={event.id} className="truncate">
                {event.title}
              </li>
            ))}
            {events.length === 0 && (
              <li className="text-slate-500">No events.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-slate-400">Cameras</p>
          <ul className="space-y-1">
            {cameras.slice(0, 3).map((camera) => (
              <li key={camera.id} className="truncate">
                {camera.name ?? camera.id}
              </li>
            ))}
            {cameras.length === 0 && (
              <li className="text-slate-500">No cameras.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
