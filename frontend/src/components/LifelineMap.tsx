import { useMemo, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Popup,
  type LayerProps,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { DrawerSelection } from "../types";
import {
  useAmbulances,
  useCameras,
  useEvents,
  useHospitals,
} from "../hooks/api";
import AmbulanceMarker from "./markers/AmbulanceMarker";
import CameraMarker from "./markers/CameraMarker";
import EventMarker from "./markers/EventMarker";
import HospitalMarker from "./markers/HospitalMarker";

type LifelineMapProps = {
  selection: DrawerSelection | null;
  onSelect: (selection: DrawerSelection) => void;
};

const TuringCityView = {
  longitude: -79.94277710160165,
  latitude: 40.44089893147938,
  zoom: 13.2,
  pitch: 56,
  bearing: -18,
};

const mapStyleUrl =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const buildingLayer: LayerProps = {
  id: "3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 15,
  paint: {
    // Low-height, semi-transparent extrusions keep markers/alerts readable
    // while still giving a subtle 3D city silhouette.
    "fill-extrusion-color": "#0f172a",
    "fill-extrusion-height": ["min", ["get", "height"], 30],
    "fill-extrusion-base": ["min", ["get", "min_height"], 8],
    "fill-extrusion-opacity": 0.35,
  },
};

/**
 * Map component built with MapLibre via react-map-gl, rendering markers and 3D buildings.
 */
export default function LifelineMap({ selection, onSelect }: LifelineMapProps) {
  const { data: events } = useEvents();
  const { data: cameras } = useCameras();
  const { data: ambulances } = useAmbulances();
  const { data: hospitals } = useHospitals();
  const [hoverInfo, setHoverInfo] = useState<{
    label: string;
    lng: number;
    lat: number;
  } | null>(null);
  const relatedIds = useMemo(() => {
    if (!selection)
      return {
        events: new Set<string>(),
        cameras: new Set<string>(),
        ambulances: new Set<string>(),
      };

    if (selection.type === "event") {
      const event = events.find((item) => item.id === selection.id);
      return {
        events: new Set(event ? [event.id] : []),
        cameras: new Set(event?.camera_id ? [event.camera_id] : []),
        ambulances: new Set(
          event?.ambulance_id ? [String(event.ambulance_id)] : [],
        ),
      };
    }

    if (selection.type === "ambulance") {
      const ambulance = ambulances.find((item) => item.id === selection.id);
      return {
        events: new Set(
          ambulance?.event_id ? [String(ambulance.event_id)] : [],
        ),
        cameras: new Set<string>(),
        ambulances: new Set(ambulance?.id ? [String(ambulance.id)] : []),
      };
    }

    return {
      events: new Set<string>(),
      cameras: new Set([selection.id]),
      ambulances: new Set<string>(),
    };
  }, [selection, events, ambulances]);

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={TuringCityView}
        mapStyle={mapStyleUrl}
        pitchWithRotate
        dragRotate
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <Layer {...buildingLayer} />
        <NavigationControl position="bottom-right" />

        {events.map((event) => (
          <EventMarker
            key={event.id}
            event={event}
            isSelected={
              selection?.type === "event" && selection.id === event.id
            }
            isRelated={relatedIds.events.has(String(event.id))}
            onSelect={() => onSelect({ type: "event", id: event.id })}
            onHover={setHoverInfo}
          />
        ))}

        {cameras.map((camera) => (
          <CameraMarker
            key={camera.id}
            camera={camera}
            isSelected={
              selection?.type === "camera" && selection.id === camera.id
            }
            isRelated={relatedIds.cameras.has(camera.id)}
            onSelect={() => onSelect({ type: "camera", id: camera.id })}
            onHover={setHoverInfo}
          />
        ))}

        {ambulances.map((ambulance) => (
          <AmbulanceMarker
            key={ambulance.id}
            ambulance={ambulance}
            isSelected={
              selection?.type === "ambulance" && selection.id === ambulance.id
            }
            isRelated={relatedIds.ambulances.has(String(ambulance.id))}
            onSelect={() => onSelect({ type: "ambulance", id: ambulance.id })}
            onHover={setHoverInfo}
          />
        ))}

        {hospitals.map((hospital) => (
          <HospitalMarker
            key={hospital.id}
            hospital={hospital}
            onHover={setHoverInfo}
          />
        ))}

        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lng}
            latitude={hoverInfo.lat}
            closeButton={false}
            closeOnClick={false}
            offset={20}
            anchor="top"
          >
            <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
              {hoverInfo.label}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
