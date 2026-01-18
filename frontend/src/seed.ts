import type { Ambulance, Camera, Event, Hospital } from "./types";

const baseLat = 40.44089893147938;
const baseLng = -79.94277710160165;

const mockEvents: Event[] = [
  {
    id: "evt-1001",
    severity: "emergency",
    title: "High-rise fire alarm",
    description:
      "Thermal spike and smoke plume detected on floors 18–22. Evacuation in progress.",
    reference_clip_url: "http://localhost:3001/frames/evt-1001.jpg",
    lat: baseLat + 0.0042,
    lng: baseLng - 0.0026,
    camera_id: "cam-nyc-01",
    ambulance_id: 1,
    status: "enroute",
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    resolved_at: null,
  },
  {
    id: "evt-1002",
    severity: "informational",
    title: "Crowd surge near plaza",
    description:
      "Density threshold exceeded briefly; crowd flow returned to normal within 6 minutes.",
    reference_clip_url: "http://localhost:3001/frames/evt-1002.jpg",
    lat: baseLat + 0.0021,
    lng: baseLng + 0.0031,
    camera_id: "cam-nyc-02",
    ambulance_id: null,
    status: "resolved",
    created_at: new Date(Date.now() - 1000 * 60 * 46).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: "evt-1003",
    severity: "emergency",
    title: "Subway platform collision",
    description:
      "Impact detected on inbound platform; multiple civilians down. Medical response required.",
    reference_clip_url: "http://localhost:3001/frames/evt-1003.jpg",
    lat: baseLat - 0.0033,
    lng: baseLng + 0.0014,
    camera_id: "cam-nyc-03",
    ambulance_id: 2,
    status: "enroute",
    created_at: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    resolved_at: null,
  },
  {
    id: "evt-1004",
    severity: "informational",
    title: "Traffic anomaly cleared",
    description: "AI detected stalled vehicles; issue resolved after reroute.",
    reference_clip_url: "http://localhost:3001/frames/evt-1004.jpg",
    lat: baseLat - 0.0015,
    lng: baseLng - 0.0039,
    camera_id: "cam-nyc-04",
    ambulance_id: null,
    status: "resolved",
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 68).toISOString(),
  },
  {
    id: "evt-1005",
    severity: "emergency",
    title: "Bridge impact alert",
    description:
      "Vehicle collision reported on the west approach. Debris present on roadway.",
    reference_clip_url: "http://localhost:3001/frames/evt-1005.jpg",
    lat: baseLat + 0.0061,
    lng: baseLng + 0.0044,
    camera_id: "cam-nyc-05",
    ambulance_id: 3,
    status: "enroute",
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    resolved_at: null,
  },
];

const mockCameras: Camera[] = [
  {
    id: "cam-nyc-01",
    lat: baseLat + 0.0036,
    lng: baseLng - 0.0021,
    latest_frame_url: "http://localhost:3001/latest_frame?camera=cam-nyc-01",
    name: "Astra-01",
  },
  {
    id: "cam-nyc-02",
    lat: baseLat + 0.0017,
    lng: baseLng + 0.0024,
    latest_frame_url: "http://localhost:3001/latest_frame?camera=cam-nyc-02",
    name: "Astra-02",
  },
  {
    id: "cam-nyc-03",
    lat: baseLat - 0.0029,
    lng: baseLng + 0.0009,
    latest_frame_url: "http://localhost:3001/latest_frame?camera=cam-nyc-03",
    name: "Astra-03",
  },
  {
    id: "cam-nyc-04",
    lat: baseLat - 0.0011,
    lng: baseLng - 0.0032,
    latest_frame_url: "http://localhost:3001/latest_frame?camera=cam-nyc-04",
    name: "Astra-04",
  },
  {
    id: "cam-nyc-05",
    lat: baseLat + 0.0054,
    lng: baseLng + 0.0036,
    latest_frame_url: "http://localhost:3001/latest_frame?camera=cam-nyc-05",
    name: "Astra-05",
  },
];

const mockAmbulances: Ambulance[] = [
  {
    id: "1",
    lat: baseLat + 0.0047,
    lng: baseLng - 0.0014,
    status: "enroute",
    event_id: 1,
    eta_seconds: 260,
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    lat: baseLat - 0.0042,
    lng: baseLng + 0.0022,
    status: "enroute",
    event_id: 2,
    eta_seconds: 420,
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    lat: baseLat + 0.0058,
    lng: baseLng + 0.0031,
    status: "enroute",
    event_id: 3,
    eta_seconds: 180,
    updated_at: new Date().toISOString(),
  },
];

const mockHospitals: Hospital[] = [
  {
    id: "hosp-1",
    name: "Central Medical Center",
    lat: baseLat + 0.0068,
    lng: baseLng - 0.0052,
  },
  {
    id: "hosp-2",
    name: "Union General",
    lat: baseLat - 0.0048,
    lng: baseLng - 0.0012,
  },
  {
    id: "hosp-3",
    name: "Riverside Hospital",
    lat: baseLat + 0.0026,
    lng: baseLng + 0.0061,
  },
];

export { mockAmbulances, mockCameras, mockEvents, mockHospitals };
