import { Marker } from "react-map-gl/maplibre";
import type { Hospital } from "../../types";

type HospitalMarkerProps = {
  hospital: Hospital;
  onHover: (value: { label: string; lng: number; lat: number } | null) => void;
  onSelect?: () => void;
  isSelected?: boolean;
  isRelated?: boolean;
};

/**
 * Marker for hospitals with a teal accent.
 */
export default function HospitalMarker({
  hospital,
  onHover,
  onSelect,
  isSelected = false,
  isRelated = false,
}: HospitalMarkerProps) {
  return (
    <Marker longitude={hospital.lng} latitude={hospital.lat}>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() =>
          onHover({
            label: hospital.name,
            lng: hospital.lng,
            lat: hospital.lat,
          })
        }
        onMouseLeave={() => onHover(null)}
        className="relative flex h-9 w-9 items-center justify-center"
        aria-label={hospital.name}
      >
        <span
          className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
            isSelected
              ? "border-white bg-teal-300"
              : isRelated
                ? "border-teal-200/70 bg-teal-300/80"
                : "border-teal-200/40 bg-teal-300/70"
          }`}
        >
          <span className="text-slate-950">🏥</span>
        </span>
      </button>
    </Marker>
  );
}
