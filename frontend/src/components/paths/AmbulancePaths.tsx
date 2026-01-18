import { useMemo } from "react";
import { Layer, Source, type LayerProps } from "react-map-gl/maplibre";
import type { Ambulance, Point } from "../../types";

type AmbulancePathsProps = {
  ambulances: Ambulance[];
};

type LineFeature = {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  properties: {
    ambulanceId: string;
    coreColor: string;
    glowColor: string;
  };
};

const toRgb = (hue: number) => {
  const c = 1;
  const x = 1 - Math.abs(((hue / 60) % 2) - 1);
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
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
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

export default function AmbulancePaths({ ambulances }: AmbulancePathsProps) {
  const features = useMemo<LineFeature[]>(() => {
    return ambulances
      .filter((ambulance) => ambulance.path && ambulance.path.length > 0)
      .map((ambulance) => {
        const path = ambulance.path ?? [];
        const { core, glow } = colorFromId(String(ambulance._id));
        const coordinates = [
          [ambulance.lng, ambulance.lat] as [number, number],
          ...path.map(mapPoint),
        ];

        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates,
          },
          properties: {
            ambulanceId: String(ambulance._id),
            coreColor: core,
            glowColor: glow,
          },
        };
      });
  }, [ambulances]);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features,
    }),
    [features],
  );

  const glowLayer: LayerProps = useMemo(
    () => ({
      id: "ambulance-paths-glow",
      type: "line",
      paint: {
        "line-color": ["get", "glowColor"],
        "line-width": 8,
        "line-blur": 4,
        "line-opacity": 0.6,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    }),
    [],
  );

  const coreLayer: LayerProps = useMemo(
    () => ({
      id: "ambulance-paths-core",
      type: "line",
      paint: {
        "line-color": ["get", "coreColor"],
        "line-width": 2.5,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    }),
    [],
  );

  if (features.length === 0) return null;

  return (
    <Source id="ambulance-paths" type="geojson" data={geojson}>
      <Layer {...glowLayer} />
      <Layer {...coreLayer} />
    </Source>
  );
}
