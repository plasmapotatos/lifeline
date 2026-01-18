import type { Ambulance, Camera, Event, Hospital, StatisticsResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch {
    throw new Error("Network error");
  }
}

/**
 * Fetch current emergency events from the backend.
 */
export function getEvents(): Promise<Event[]> {
  return fetchJson<Event[]>("/events");
}

/**
 * Fetch current camera telemetry from the backend.
 */
export function getCameras(): Promise<Camera[]> {
  return fetchJson<Camera[]>("/cameras");
}

/**
 * Fetch current ambulance locations from the backend.
 */
export function getAmbulances(): Promise<Ambulance[]> {
  return fetchJson<Ambulance[]>("/ambulances");
}

/**
 * Fetch hospital locations from the backend.
 */
export function getHospitals(): Promise<Hospital[]> {
  return fetchJson<Hospital[]>("/hospitals");
}

/**
 * Fetch statistics from the backend.
 */
export function getStatistics(): Promise<StatisticsResponse> {
  return fetchJson<StatisticsResponse>("/statistics");
}

/**
 * Manually trigger an emergency event for a camera.
 */
export async function triggerCameraEmergency(cameraId: string): Promise<Event> {
  const response = await fetch(`${API_BASE}/cameras/${cameraId}/trigger_emergency`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to trigger emergency: ${response.status}`);
  }
  
  const data = await response.json();
  return data.event;
}
