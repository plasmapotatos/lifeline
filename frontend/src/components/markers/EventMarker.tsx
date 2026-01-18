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

  const innerBg = isEmergency ? "bg-red-500" : "bg-amber-400/70";
  const innerBorder = isEmergency ? "border-red-300/40" : "border-amber-300/40";

  return (
    <Marker longitude={event.lng} latitude={event.lat}>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() =>
          onHover({ label: event.title, lng: event.lng, lat: event.lat })
        }
        onMouseLeave={() => onHover(null)}
        className="relative flex h-10 w-10 items-center justify-center"
        aria-label={event.title}
      >
        {/* Pulsing glow */}
        <span
          className={`absolute inline-flex h-10 w-10 rounded-full opacity-30 ${severityGlow} ${pulse}`}
        />

        {/* Inner circle */}
        <span
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${innerBorder} ${innerBg} ${
            isSelected ? "border-white" : isRelated ? "border-opacity-70" : ""
          }`}
        >
          <span className="text-white">!</span>
        </span>
      </button>
    </Marker>
  );
}
