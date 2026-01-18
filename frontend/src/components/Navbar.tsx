import Button from "./Button";

type NavbarProps = {
  userName?: string;
  userRole?: string;
  activeTab?: "map" | "events" | "statistics";
  onTabChange?: (tab: "map" | "events" | "statistics") => void;
};

/**
 * Top navigation bar with branding, user info, and sign out.
 */
export default function Navbar({
  userName = "Operator Tim W.",
  userRole = "Command Tier • On Duty",
  activeTab,
  onTabChange,
}: NavbarProps) {
  return (
    <nav className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="vital-sign-monitor">
            <div className="vital-sign-line">
              <svg viewBox="0 0 80 20" preserveAspectRatio="none">
                {/* Compact EKG/heartbeat pattern - smaller but more pronounced */}
                <path d="M0,10 L15,10 L17,1 L19,19 L21,1 L23,19 L25,10 L50,10 L52,4 L54,16 L56,2 L58,18 L60,10 L80,10" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-[0.2em] text-cyan-200">
              Lifeline
            </h1>
            <p className="text-xs text-slate-400">Turing City Emergency Grid</p>
          </div>
        </div>
        {onTabChange && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => onTabChange("map")}
              className={`rounded-full px-4 py-1 transition ${
                activeTab === "map"
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Live Map
            </button>
            <button
              type="button"
              onClick={() => onTabChange("events")}
              className={`rounded-full px-4 py-1 transition ${
                activeTab === "events"
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => onTabChange("statistics")}
              className={`rounded-full px-4 py-1 transition ${
                activeTab === "statistics"
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Statistics
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-xs text-slate-300">
          <p className="text-sm font-semibold">{userName}</p>
          <p className="text-slate-500">{userRole}</p>
        </div>
        <Button variant="outline">Sign Out</Button>
      </div>
    </nav>
  );
}
