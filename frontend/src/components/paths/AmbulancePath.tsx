import { useMemo } from "react";
import { Layer, Source, type LayerProps } from "react-map-gl/maplibre";
import type { Ambulance, Point } from "../../types";

type AmbulancePathProps = {
  ambulance: Ambulance;
};

const toRgb = (hue: number) => {
  const c = 1;
  const x = 1 - Math.abs(((hue / 60) % 2) - 1);
  const m = 0;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const colorFromId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  const { r, g, b } = toRgb(hash);
  return {
    core: `rgb(${r}, ${g}, ${b})`,
    glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
  };
};

const mapPoint = (point: Point) => [point.lng, point.lat] as [number, number];

export default function AmbulancePath({ ambulance }: AmbulancePathProps) {
  const path = ambulance.path ?? [];
  const hasPath = path.length > 0;

  const { core, glow } = useMemo(
    () => colorFromId(String(ambulance._id)),
    [ambulance._id],
  );

  const coordinates = useMemo(() => {
    const line = [[ambulance.lng, ambulance.lat] as [number, number]];
    return line.concat(path.map(mapPoint));
  }, [ambulance.lat, ambulance.lng, path]);

  const geojson = useMemo(
    () => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates,
      },
      properties: {
        ambulanceId: ambulance._id,
      },
    }),
    [ambulance._id, coordinates],
  );

  const glowLayer: LayerProps = useMemo(
    () => ({
      id: `ambulance-path-glow-${ambulance._id}`,
      type: "line",
      paint: {
        "line-color": glow,
        "line-width": 8,
        "line-blur": 4,
        "line-opacity": 0.6,
      },
    }),
    [ambulance._id, glow],
  );

  const coreLayer: LayerProps = useMemo(
    () => ({
      id: `ambulance-path-core-${ambulance._id}`,
      type: "line",
      paint: {
        "line-color": core,
        "line-width": 2.5,
      },
    }),
    [ambulance._id, core],
  );

  if (!hasPath) return null;

  return (
    <Source
      id={`ambulance-path-${ambulance._id}`}
      type="geojson"
      data={geojson}
    >
      <Layer {...glowLayer} />
      <Layer {...coreLayer} />
    </Source>
  );
}
