import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Ambulance, Camera, Event } from "../types";

const WS_URL = "ws://localhost:8000/ws/live";

type LiveMessage =
  | { type: "ambulances"; data: Ambulance[] }
  | { type: "events"; data: Event[] }
  | { type: "cameras"; data: Camera[] };

type LiveStatus = "connecting" | "open" | "closed" | "error";

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
          // Replace the entire ambulances array
          queryClient.setQueryData<Ambulance[]>(["ambulances"], message.data);
          return;
        }

        if (message.type === "events") {
          queryClient.setQueryData<Event[]>(["events"], message.data);
          return;
        }

        if (message.type === "cameras") {
          // Normalize to _id if needed
          queryClient.setQueryData<Camera[]>(["cameras"], message.data);
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
