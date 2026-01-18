import { useStatistics } from "../hooks/api";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatSeconds = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${secs.toFixed(0)}s`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Statistics page displaying comprehensive system statistics.
 */
export default function StatisticsPage() {
  const {
    data: statistics,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useStatistics();

  return (
    <div className="h-screen overflow-auto p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-500/70 via-blue-500/70 to-purple-500/70 bg-clip-text text-transparent">
              System Statistics
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Real-time performance metrics and fleet overview
            </p>
          </div>
          <button
            type="button"
            disabled={isRefetching}
            className="rounded-xl bg-gradient-to-r from-slate-700/30 to-slate-600/30 border border-slate-600/40 px-4 py-2 text-sm text-slate-300 hover:from-slate-700/40 hover:to-slate-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
            onClick={() => refetch()}
          >
            {isRefetching ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/60 p-8 text-center text-slate-300">
            Loading statistics...
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="text-lg font-semibold text-red-300 mb-2">
              Error Loading Statistics
            </div>
            <div className="text-sm text-red-100 mb-4">
              {(error as Error)?.message ?? "Failed to load statistics."}
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm text-red-200 hover:bg-red-500/30 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !isError && statistics ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-slate-700/20 transition-all hover:border-slate-600/40 group">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Total Events
                </div>
                <div className="text-4xl font-bold text-slate-300 group-hover:text-slate-200 transition-colors">
                  {statistics.total_events.toLocaleString()}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  All events recorded
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-700/30 p-6 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-slate-700/20 transition-all hover:border-slate-600/40 group">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Resolved Events
                </div>
                <div className="text-4xl font-bold text-emerald-500/60 group-hover:text-emerald-500/70 transition-colors">
                  {statistics.events_resolved.toLocaleString()}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {statistics.total_events > 0
                    ? `${Math.round((statistics.events_resolved / statistics.total_events) * 100)}%`
                    : "0%"}{" "}
                  resolved
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-700/30 p-6 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-slate-700/20 transition-all hover:border-slate-600/40 group">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Active Emergencies
                </div>
                <div className="text-4xl font-bold text-red-500/60 group-hover:text-red-500/70 transition-colors">
                  {statistics.active_emergencies}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Currently unresolved and severe
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-700/30 p-6 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-slate-700/20 transition-all hover:border-slate-600/40 group">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Fleet Size
                </div>
                <div className="text-4xl font-bold text-blue-500/60 group-hover:text-blue-500/70 transition-colors">
                  {statistics.fleet_overview.length}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Total ambulances
                </div>
              </div>
            </div>

            {/* Response Times */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-700/30 p-6 backdrop-blur-sm shadow-xl hover:shadow-slate-700/20 transition-all">
                <div className="text-sm font-medium text-slate-400 mb-1">
                  Average Dispatch Time
                </div>
                <div className="text-3xl font-bold text-cyan-500/60 mt-2">
                  {formatSeconds(statistics.avg_dispatch_time_seconds)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Time from detected → dispatched
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-700/30 p-6 backdrop-blur-sm shadow-xl hover:shadow-slate-700/20 transition-all">
                <div className="text-sm font-medium text-slate-400 mb-1">
                  Average Response Time
                </div>
                <div className="text-3xl font-bold text-emerald-500/60 mt-2">
                  {formatSeconds(statistics.avg_response_time_seconds)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Time from dispatch → resolved
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Severity Breakdown Pie Chart */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 backdrop-blur-sm shadow-xl">
                <div className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Severity Breakdown
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Emergency",
                          value: statistics.severity_breakdown.emergency,
                        },
                        {
                          name: "Informational",
                          value: statistics.severity_breakdown.informational,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="rgba(239, 68, 68, 0.7)" />
                      <Cell fill="rgba(96, 165, 250, 0.7)" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "0.75rem",
                        color: "#e2e8f0",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="text-xs text-slate-500">Emergency</div>
                    <div className="mt-1 text-lg font-bold text-red-500/60">
                      {statistics.severity_breakdown.emergency}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="text-xs text-slate-500">Informational</div>
                    <div className="mt-1 text-lg font-bold text-blue-500/60">
                      {statistics.severity_breakdown.informational}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fleet Status Distribution */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 backdrop-blur-sm shadow-xl">
                <div className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Fleet Status Distribution
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      {
                        status: "Free",
                        count: statistics.fleet_overview.filter(
                          (a) => a.status === "free",
                        ).length,
                      },
                      {
                        status: "In Transit",
                        count: statistics.fleet_overview.filter(
                          (a) => a.status === "in_transit",
                        ).length,
                      },
                      {
                        status: "Unavailable",
                        count: statistics.fleet_overview.filter(
                          (a) => a.status === "unavailable",
                        ).length,
                      },
                    ]}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="status"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "0.75rem",
                        color: "#e2e8f0",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {[
                        statistics.fleet_overview.filter(
                          (a) => a.status === "free",
                        ).length,
                        statistics.fleet_overview.filter(
                          (a) => a.status === "in_transit",
                        ).length,
                        statistics.fleet_overview.filter(
                          (a) => a.status === "unavailable",
                        ).length,
                      ].map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "rgba(52, 211, 153, 0.7)"
                              : index === 1
                                ? "rgba(251, 191, 36, 0.7)"
                                : "rgba(248, 113, 113, 0.7)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fleet Overview Table */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Fleet Overview
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {statistics.fleet_overview.length} ambulances
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5">
                  <thead className="bg-slate-950/60">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ambulance ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Current Event
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        ETA
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Events Handled
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-950/30">
                    {statistics.fleet_overview.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No ambulances in fleet
                        </td>
                      </tr>
                    ) : (
                      statistics.fleet_overview.map((ambulance) => (
                        <tr
                          key={ambulance.ambulance_id}
                          className="hover:bg-slate-900/50 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                              {ambulance.ambulance_id.slice(-8)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                ambulance.status === "free"
                                  ? "bg-emerald-500/15 text-emerald-400/70 border border-emerald-500/25"
                                  : ambulance.status === "in_transit"
                                    ? "bg-yellow-500/15 text-yellow-400/70 border border-yellow-500/25"
                                    : ambulance.status === "unavailable"
                                      ? "bg-red-500/15 text-red-400/70 border border-red-500/25"
                                      : "bg-blue-500/15 text-blue-400/70 border border-blue-500/25"
                              }`}
                            >
                              {ambulance.status.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-500 font-mono">
                              {ambulance.current_event_id
                                ? ambulance.current_event_id.slice(-8)
                                : "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-400">
                              {ambulance.eta_seconds
                                ? formatSeconds(ambulance.eta_seconds)
                                : "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-blue-500/60">
                              {ambulance.events_handled}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : !isLoading && !isError ? (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <div className="text-lg font-semibold text-yellow-300 mb-2">
              No Data Available
            </div>
            <div className="text-sm text-yellow-100">
              Statistics data is not available. Please try refreshing.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
