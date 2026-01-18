import { useMemo, useState } from "react";
import {
  NotificationStack,
  type NotificationItem,
} from "./components/Notification";
import Drawer from "./components/Drawer";
import LifelineMap from "./components/LifelineMap";
import LiveDataPanel from "./components/LiveDataPanel";
import Navbar from "./components/Navbar";
import EventsPage from "./pages/Events";
import StatisticsPage from "./pages/Statistics";
import { useAmbulances, useCameras, useEvents } from "./hooks/api";
import { useLiveData } from "./hooks/useLiveData";
import type { Ambulance, Camera, DrawerSelection, Event } from "./types";
import { isEmergencySeverity } from "./types";
import EventDrawer from "./components/drawers/EventDrawer";
import CameraDrawer from "./components/drawers/CameraDrawer";
import AmbulanceDrawer from "./components/drawers/AmbulanceDrawer";

/**
 * Top-level Lifeline application component.
 */
function App() {
  useLiveData();
  const { data: events } = useEvents();
  console.log("Events:", events);

  const { data: cameras } = useCameras();
  console.log("Cameras:", cameras);
  const { data: ambulances } = useAmbulances();
  console.log("Ambulances:", ambulances);

  const [selection, setSelection] = useState<DrawerSelection | null>(null);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<
    string[]
  >([]);
  const [activeTab, setActiveTab] = useState<"map" | "events" | "statistics">(
    "map",
  );

  const notifications = useMemo<NotificationItem[]>(() => {
    const items = events
      .filter(
        (event) =>
          isEmergencySeverity(event.severity) && event.status !== "resolved",
      )
      .map((event) => {
        const assignedAmbulance = ambulances.find(
          (ambulance) => String(ambulance._id) === String(event.ambulance_id),
        );
        const etaMinutes =
          assignedAmbulance?.eta_seconds != null
            ? Math.max(1, Math.round(assignedAmbulance.eta_seconds / 60))
            : null;
        return {
          id: `alert-${event._id}`,
          type: "alert",
          message: `Emergency: ${event.title} • Severity ${event.severity}${
            etaMinutes ? ` • ETA ${etaMinutes} min` : ""
          }`,
          duration: 6000,
        } satisfies NotificationItem;
      })
      .filter((item) => !dismissedNotificationIds.includes(item.id));

    return items.slice(0, 4);
  }, [events, ambulances, dismissedNotificationIds]);

  const selectedEntity = useMemo(() => {
    if (!selection) return null;
    if (selection.type === "event") {
      return events.find((event) => event._id === selection.id) ?? null;
    }
    if (selection.type === "camera") {
      return cameras.find((camera) => camera._id === selection.id) ?? null;
    }
    return (
      ambulances.find((ambulance) => ambulance._id === selection.id) ?? null
    );
  }, [selection, events, cameras, ambulances]);

  return (
    <div className="h-screen bg-slate-950 text-slate-100">
      <div className="relative flex h-full flex-col">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="relative flex flex-1 min-h-0 overflow-hidden">
          {activeTab === "map" ? (
            <>
              <main className="flex-1">
                <LifelineMap
                  selection={selection}
                  onSelect={(next) => setSelection(next)}
                />
              </main>
              <LiveDataPanel />
            </>
          ) : activeTab === "events" ? (
            <main className="flex-1 overflow-y-auto">
              <EventsPage
                onSelectEvent={(eventId) =>
                  setSelection({ type: "event", id: eventId })
                }
              />
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto">
              <StatisticsPage />
            </main>
          )}

          <Drawer
            title={
              selection?.type === "event"
                ? "Emergency Event"
                : selection?.type === "camera"
                  ? "Camera Feed"
                  : selection?.type === "ambulance"
                    ? "Ambulance Unit"
                    : "Select a marker"
            }
            subtitle={selection ? "Live Intelligence" : "Map only"}
            isOpen={Boolean(selection)}
            onClose={() => setSelection(null)}
          >
            {!selection && (
              <p className="text-sm text-slate-400">
                Select an event, camera, or ambulance marker to inspect detailed
                telemetry.
              </p>
            )}

            {selection?.type === "event" && selectedEntity && (
              <EventDrawer
                event={selectedEntity as Event}
                ambulances={ambulances}
              />
            )}

            {selection?.type === "camera" && selectedEntity && (
              <CameraDrawer
                camera={selectedEntity as Camera}
                events={events.filter(
                  (event) =>
                    event.camera_name === (selectedEntity as Camera).name,
                )}
              />
            )}

            {selection?.type === "ambulance" && selectedEntity && (
              <AmbulanceDrawer ambulance={selectedEntity as Ambulance} />
            )}
          </Drawer>

          <NotificationStack
            items={notifications}
            onDismiss={(id) =>
              setDismissedNotificationIds((prev) =>
                prev.includes(id) ? prev : [...prev, id],
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

export default App;
