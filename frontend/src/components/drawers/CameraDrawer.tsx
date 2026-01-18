import { useState } from "react";
import { getLatestClipURL, triggerCameraEmergency } from "../../api/controller";
import { useQueryClient } from "@tanstack/react-query";
import type { Camera, Event } from "../../types";

const formatTimeAgo = (timestamp?: string | Date | null) => {
  if (!timestamp) return "—";
  const date =
    typeof timestamp === "string" ? new Date(timestamp + "Z") : timestamp;
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

type CameraDrawerProps = {
  camera: Camera;
  events: Event[];
};

export default function CameraDrawer({ camera, events }: CameraDrawerProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  console.log("camera events:", events);

  const handleTriggerEmergency = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    if (!description.trim()) {
      alert("Please enter a description.");
      return;
    }

    setIsTriggering(true);
    try {
      const latest_clip_url = await getLatestClipURL(camera.url);
      console.log("Latest clip URL:", latest_clip_url);
      await triggerCameraEmergency(camera._id, description, latest_clip_url);
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["cameras"] });
      setShowConfirm(false);
      setDescription("");
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
        src={`${camera.url}/mjpeg`}
        alt={`Camera snapshot - ${camera.name || camera._id}`}
        className="w-full rounded-2xl border border-white/10"
      />

      {/* Manual Emergency Trigger */}
      <div className="space-y-2">
        {!showConfirm ? (
          <button
            type="button"
            onClick={handleTriggerEmergency}
            className="w-full rounded-xl border-2 border-red-500/50 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
          >
            🚨 Trigger Emergency
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Describe the emergency for {camera.name}
            </p>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Person collapsed and unresponsive"
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              rows={3}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTriggerEmergency}
                disabled={isTriggering}
                className="flex-1 rounded-xl border-2 border-red-500 bg-red-500/30 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/40 disabled:opacity-50"
              >
                {isTriggering ? "Triggering..." : "Confirm"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setDescription("");
                }}
                className="flex-1 rounded-xl border border-white/20 bg-slate-800/60 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800/80"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Events */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Recent Events
        </p>
        <ul className="space-y-2 text-xs text-slate-300">
          {events.slice(0, 5).map((event) => (
            <li
              key={event._id}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{event.title}</span>
                <span className="text-[10px] text-slate-500">
                  {formatTimeAgo(event.created_at)}
                </span>
              </div>
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
