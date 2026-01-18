export type EventSeverity = "informational" | "emergency";
export type EventStatus = "open" | "enroute" | "resolved";
export type AmbulanceStatus = "idle" | "enroute" | "unavailable";

export type IdValue = string | number;

export type Event = {
  id: string;
  severity: EventSeverity;
  title: string;
  description: string;
  reference_clip_url: string;
  lat: number;
  lng: number;
  camera_id: string;
  camera_name?: string | null;
  ambulance_id: string | null;
  status: EventStatus;
  created_at: string | Date;
  resolved_at?: string | Date | null;
};

export type Camera = {
  id: string;
  lat: number;
  lng: number;
  latest_frame_url: string;
  name?: string | null;
};

export type Ambulance = {
  id: string;
  lat: number;
  lng: number;
  status: AmbulanceStatus;
  event_id: number | null;
  eta_seconds?: number | null;
  updated_at: string;
};

export type Hospital = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type DrawerSelection =
  | { type: "event"; id: string }
  | { type: "camera"; id: string }
  | { type: "ambulance"; id: string };

export const isEmergencySeverity = (severity: EventSeverity) =>
  severity === "emergency";

export type StatisticsResponse = {
  total_events: number;
  events_resolved: number;
  avg_dispatch_time_seconds: number;
  avg_response_time_seconds: number;
  active_emergencies: number;
  severity_breakdown: {
    informational: number;
    emergency: number;
  };
  fleet_overview: {
    ambulance_id: string;
    status: "free" | "assigned" | "in_transit" | "unavailable";
    current_event_id: string | null;
    eta_seconds: number | null;
    events_handled: number;
  }[];
};
