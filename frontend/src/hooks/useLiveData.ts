import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Ambulance, Camera, Event } from "../types";

const WS_URL = "ws://localhost:8000/ws/live";

type LiveMessage =
  | { type: "ambulances"; data: Ambulance[] }
  | { type: "events"; data: Event[] }
  | { type: "cameras"; data: Camera[] };

type LiveStatus = "connecting" | "open" | "closed" | "error";

/**
 * Normalize Mongo-style `_id` to `id`
 */
function normalizeId<T extends { _id?: unknown; id?: unknown }>(
  obj: T,
): T & {
  id: unknown;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { _id, ...rest } = obj as any;
  return {
    id: _id ?? obj.id,
    ...rest,
  };
}

/**
 * Normalize arrays of entities
 */
function normalizeArray<T extends { _id?: unknown; id?: unknown }>(
  items: T[],
): (T & { id: unknown })[] {
  return items.map(normalizeId);
}

export function useLiveData() {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<LiveStatus>("connecting");

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      console.info("[Live] WebSocket connected");
    };

    ws.onclose = () => {
      setStatus("closed");
      console.info("[Live] WebSocket disconnected");
    };

    ws.onerror = () => {
      setStatus("error");
      console.warn("[Live] WebSocket error");
    };

    ws.onmessage = (event) => {
      console.log("[Live] Message received:", event.data);

      try {
        const message = JSON.parse(event.data) as LiveMessage;

        if (message.type === "ambulances") {
          queryClient.setQueryData<Ambulance[]>(
            ["ambulances"],
            normalizeArray(message.data),
          );
          return;
        }

        if (message.type === "events") {
          queryClient.setQueryData<Event[]>(
            ["events"],
            normalizeArray(message.data),
          );
          return;
        }

        if (message.type === "cameras") {
          queryClient.setQueryData<Camera[]>(
            ["cameras"],
            normalizeArray(message.data),
          );
          return;
        }
      } catch (error) {
        console.warn("[Live] Failed to parse message", error);
      }
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  const send = useMemo(
    () => (payload: unknown) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify(payload));
      return true;
    },
    [],
  );

  return { status, send };
}
