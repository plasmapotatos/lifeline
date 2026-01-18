import { Marker } from "react-map-gl/maplibre";
import type { Event } from "../../types";

type EventMarkerProps = {
  event: Event;
  isSelected: boolean;
  isRelated: boolean;
  onSelect: () => void;
  onHover: (value: { label: string; lng: number; lat: number } | null) => void;
};

/**
 * Marker for emergency events with pulsing severity ring.
 */
export default function EventMarker({
  event,
  isSelected,
  isRelated,
  onSelect,
  onHover,
}: EventMarkerProps) {
  const isEmergency = event.severity === "emergency";
  const severityGlow = isEmergency ? "bg-red-500" : "bg-amber-400";
  const pulse = isEmergency ? "animate-ping" : "animate-pulse";

  return (
    <Marker longitude={event.lng} latitude={event.lat}>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() =>
          onHover({
            label: event.title,
            lng: event.lng,
            lat: event.lat,
          })
        }
        onMouseLeave={() => onHover(null)}
        className="relative flex h-10 w-10 items-center justify-center"
        aria-label={event.title}
      >
        <span
          className={`absolute inline-flex h-10 w-10 rounded-full opacity-30 ${severityGlow} ${pulse}`}
        />
        <span
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${
            isSelected
              ? "border-white bg-red-500"
              : isRelated
                ? "border-red-300/70 bg-red-500/80"
                : "border-red-300/40 bg-red-500/70"
          }`}
        >
          <span className="text-white">!</span>
        </span>
      </button>
    </Marker>
  );
}
