import { useMemo, useState, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type HeaderGroup,
  type Row,
} from "@tanstack/react-table";
import { useEvents } from "../hooks/api";
import type { Event } from "../types";

const formatTimestamp = (timestamp?: string | Date) => {
  if (!timestamp) return "—";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const formatTimeAgo = (timestamp?: string | Date) => {
  if (!timestamp) return "—";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) return "—";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

/**
 * Events page displaying historical emergencies in a table.
 */
type EventsPageProps = {
  onSelectEvent?: (eventId: string) => void;
};

export default function EventsPage({ onSelectEvent }: EventsPageProps) {
  const { data: eventsData, isLoading, isError, error, refetch, isRefetching } = useEvents();
  const events: Event[] = Array.isArray(eventsData) ? eventsData : [];
  const [nextEventCountdown, setNextEventCountdown] = useState(10);
  const [lastEventCount, setLastEventCount] = useState(0);
  const [lastRefetchTime, setLastRefetchTime] = useState<number>(Date.now());

  // Countdown timer for next event (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setNextEventCountdown((prev) => {
        if (prev <= 1) {
          return 10; // Reset to 10 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset countdown when new event appears or when refetch happens
  useEffect(() => {
    if (events.length > lastEventCount) {
      setNextEventCountdown(10);
      setLastEventCount(events.length);
    }
  }, [events.length, lastEventCount]);

  // Track when refetch happens and reset countdown
  useEffect(() => {
    if (isRefetching) {
      setLastRefetchTime(Date.now());
    } else if (!isLoading && lastRefetchTime > 0) {
      // Refetch just completed, reset countdown
      setNextEventCountdown(10);
    }
  }, [isRefetching, isLoading, lastRefetchTime]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime; // Newest first
    });
  }, [events]);

  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        header: "Title",
        accessorKey: "title",
        cell: (info: CellContext<Event, unknown>) => (
          <span className="font-semibold text-slate-100">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: "Severity",
        accessorKey: "severity",
        cell: (info: CellContext<Event, unknown>) => {
          const value = info.getValue() as Event["severity"];
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                value === "emergency"
                  ? "bg-red-500/20 text-red-200"
                  : "bg-blue-500/20 text-blue-200"
              }`}
            >
              {value.toUpperCase()}
            </span>
          );
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: (info: CellContext<Event, unknown>) => (
          <span className="text-slate-300 text-sm">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: "Camera",
        accessorKey: "camera_name",
        cell: (info: CellContext<Event, unknown>) => {
          const event = info.row.original;
          const cameraName = event.camera_name || event.camera_id;
          return (
            <span className="text-slate-300 font-mono text-xs">
              {cameraName}
            </span>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (info: CellContext<Event, unknown>) => {
          const status = (info.getValue() as string) || "open";
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                status === "resolved"
                  ? "bg-green-500/20 text-green-200"
                  : status === "enroute"
                    ? "bg-yellow-500/20 text-yellow-200"
                    : "bg-slate-500/20 text-slate-200"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        header: "Time",
        accessorKey: "created_at",
        cell: (info: CellContext<Event, unknown>) => {
          const timestamp = info.getValue() as string | Date | undefined;
          return (
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs">
                {formatTimeAgo(timestamp)}
              </span>
              <span className="text-slate-500 text-xs">
                {formatTimestamp(timestamp)}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: sortedEvents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Live Events Feed</h2>
          <p className="text-xs text-slate-400">
            New events appear every 10 seconds • {events.length} total events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400">
              {isRefetching ? "Refreshing..." : "Next refresh in"}
            </span>
            <span className={`text-lg font-bold ${isRefetching ? "text-cyan-300 animate-pulse" : "text-cyan-400"}`}>
              {isRefetching ? "..." : `${nextEventCountdown}s`}
            </span>
          </div>
          <button
            type="button"
            disabled={isRefetching}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-cyan-400/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              refetch();
              setNextEventCountdown(10);
            }}
          >
            {isRefetching ? "Refreshing..." : "Refresh Now"}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
          Loading events...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {(error as Error)?.message ?? "Failed to load events."}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-400">
              {table
                .getHeaderGroups()
                .map((headerGroup: HeaderGroup<Event>) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                    No events yet. New events will appear every 10 seconds.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row: Row<Event>) => {
                  const event = row.original;
                  const isNew = event.created_at
                    ? Date.now() - new Date(event.created_at).getTime() < 15000
                    : false;
                  return (
                    <tr
                      key={row.id}
                      className={`cursor-pointer transition ${
                        isNew
                          ? "bg-cyan-500/5 border-l-2 border-l-cyan-500"
                          : "hover:bg-slate-900/40"
                      }`}
                      onClick={() => onSelectEvent?.(event.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
