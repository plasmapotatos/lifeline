import { useState, useEffect } from "react";
import { triggerCameraEmergency } from "../../api/controller";
import { useQueryClient } from "@tanstack/react-query";
import type { Camera, Event } from "../../types";

type CameraDrawerProps = {
  camera: Camera;
  events: Event[];
};

/**
 * Drawer content for a city camera.
 */
export default function CameraDrawer({ camera, events }: CameraDrawerProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const queryClient = useQueryClient();

  // Refresh camera image every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setImageKey((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerEmergency = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsTriggering(true);
    try {
      await triggerCameraEmergency(camera.id);
      // Invalidate queries to refresh events
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["cameras"] });
      setShowConfirm(false);
    } catch (error) {
      console.error("Failed to trigger emergency:", error);
      alert("Failed to trigger emergency. Please try again.");
    } finally {
      setIsTriggering(false);
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold">Camera {camera.name}</p>
        <p className="text-xs text-slate-400">
          {events.length} recorded events
        </p>
      </div>
      <img
        src={`${camera.latest_frame_url}?t=${imageKey}`}
        alt={`Camera snapshot - ${camera.name || camera.id}`}
        className="w-full rounded-2xl border border-white/10"
        key={`${camera.id}-${imageKey}`}
      />

      {/* Manual Emergency Trigger Button */}
      <div className="space-y-2">
        {!showConfirm ? (
          <button
            type="button"
            onClick={handleTriggerEmergency}
            disabled={isTriggering}
            className="w-full rounded-xl border-2 border-red-500/50 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 hover:border-red-500/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚨 Trigger Emergency
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-300">
              Confirm emergency trigger for {camera.name}?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTriggerEmergency}
                disabled={isTriggering}
                className="flex-1 rounded-xl border-2 border-red-500 bg-red-500/30 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/40 disabled:opacity-50"
              >
                {isTriggering ? "Triggering..." : "Confirm Emergency"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isTriggering}
                className="flex-1 rounded-xl border border-white/20 bg-slate-800/60 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800/80 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Recent Events
        </p>
        <ul className="space-y-2 text-xs text-slate-300">
          {events.slice(0, 5).map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2"
            >
              {event.title}
            </li>
          ))}
          {events.length === 0 && (
            <li className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-500">
              No recent events.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
