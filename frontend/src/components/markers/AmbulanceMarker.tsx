import { useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl/maplibre";
import type { Ambulance } from "../../types";

type AmbulanceMarkerProps = {
  ambulance: Ambulance;
  isSelected: boolean;
  isRelated: boolean;
  onSelect: () => void;
  onHover: (value: { label: string; lng: number; lat: number } | null) => void;
};

/**
 * Marker for ambulances with subtle motion emphasis.
 */
export default function AmbulanceMarker({
  ambulance,
  isSelected,
  isRelated,
  onSelect,
  onHover,
}: AmbulanceMarkerProps) {
  const [position, setPosition] = useState({
    lat: ambulance.lat,
    lng: ambulance.lng,
  });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const start = { ...position };
    const target = { lat: ambulance.lat, lng: ambulance.lng };
    const duration = 700;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);

      setPosition({
        lat: start.lat + (target.lat - start.lat) * eased,
        lng: start.lng + (target.lng - start.lng) * eased,
      });

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ambulance.lat, ambulance.lng]);

  return (
    <Marker
      longitude={position.lng}
      latitude={position.lat}
      className="transition-transform duration-700 ease-in-out"
    >
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() =>
          onHover({
            label: `Ambulance ${ambulance.id}`,
            lng: position.lng,
            lat: position.lat,
          })
        }
        onMouseLeave={() => onHover(null)}
        className="relative flex h-9 w-9 items-center justify-center transition-transform duration-700"
        aria-label={`Ambulance ${ambulance.id}`}
      >
        <span
          className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
            isSelected
              ? "border-white bg-emerald-400"
              : isRelated
                ? "border-emerald-200/70 bg-emerald-400/80"
                : "border-emerald-200/40 bg-emerald-400/70"
          }`}
        >
          <span className="text-slate-950">🚑</span>
        </span>
      </button>
    </Marker>
  );
}
