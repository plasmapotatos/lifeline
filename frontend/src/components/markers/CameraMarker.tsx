import { Marker } from "react-map-gl/maplibre";
import type { Camera } from "../../types";

type CameraMarkerProps = {
  camera: Camera;
  isSelected: boolean;
  isRelated: boolean;
  onSelect: () => void;
  onHover: (value: { label: string; lng: number; lat: number } | null) => void;
};

/**
 * Marker for city cameras with a blue accent.
 */
export default function CameraMarker({
  camera,
  isSelected,
  isRelated,
  onSelect,
  onHover,
}: CameraMarkerProps) {
  const cameraLabel = camera.name ? camera.name : `Camera ${camera.id}`;

  return (
    <Marker longitude={camera.lng} latitude={camera.lat}>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() =>
          onHover({
            label: cameraLabel,
            lng: camera.lng,
            lat: camera.lat,
          })
        }
        onMouseLeave={() => onHover(null)}
        className="relative flex h-9 w-9 items-center justify-center"
        aria-label={cameraLabel}
      >
        <span
          className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
            isSelected
              ? "border-white bg-cyan-400"
              : isRelated
                ? "border-cyan-200/70 bg-cyan-400/80"
                : "border-cyan-200/40 bg-cyan-400/70"
          }`}
        >
          <span className="text-slate-950">📷</span>
        </span>
      </button>
    </Marker>
  );
}
