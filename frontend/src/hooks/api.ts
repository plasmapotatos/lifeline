import { useQuery } from "@tanstack/react-query";
import {
  getAmbulances,
  getCameras,
  getEvents,
  getHospitals,
  getStatistics,
} from "../api/controller";
import {
  mockAmbulances,
  mockCameras,
  mockEvents,
  mockHospitals,
} from "../seed";
import type { Ambulance, Camera, Event, Hospital, StatisticsResponse } from "../types";

const REFRESH_INTERVAL = 10000; // Match the 10-second analysis interval

/**
 * Fetch emergency events with auto-refresh.
 */
export function useEvents() {
  const query = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        return await getEvents();
      } catch {
        return mockEvents;
      }
    },
    refetchInterval: REFRESH_INTERVAL, // Refetch every 10 seconds
    refetchIntervalInBackground: true, // Continue refetching when tab is in background
    staleTime: 0, // Always consider data stale so it refetches on interval
    initialData: [],
  });

  return {
    ...query,
    data: query.data ?? [],
  };
}

/**
 * Fetch camera telemetry with auto-refresh.
 */
export function useCameras() {
  const query = useQuery<Camera[]>({
    queryKey: ["cameras"],
    queryFn: async () => {
      try {
        return await getCameras();
      } catch {
        return mockCameras;
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: 2000,
    initialData: [],
  });

  return {
    ...query,
    data: query.data ?? [],
  };
}

/**
 * Fetch ambulance locations with auto-refresh.
 */
export function useAmbulances() {
  const query = useQuery<Ambulance[]>({
    queryKey: ["ambulances"],
    queryFn: async () => {
      try {
        return await getAmbulances();
      } catch {
        return mockAmbulances;
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: 2000,
    initialData: [],
  });

  return {
    ...query,
    data: query.data ?? [],
  };
}

/**
 * Fetch hospital locations.
 */
export function useHospitals() {
  const query = useQuery<Hospital[]>({
    queryKey: ["hospitals"],
    queryFn: async () => {
      try {
        return await getHospitals();
      } catch {
        return mockHospitals;
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: 2000,
    initialData: [],
  });

  return {
    ...query,
    data: query.data ?? [],
  };
}

/**
 * Fetch statistics with auto-refresh.
 */
export function useStatistics() {
  const query = useQuery<StatisticsResponse>({
    queryKey: ["statistics"],
    queryFn: async () => {
      try {
        return await getStatistics();
      } catch (error) {
        console.error("Statistics fetch error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to load statistics");
      }
    },
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: 2000,
    retry: 3,
    retryDelay: 1000,
  });

  return query;
}
