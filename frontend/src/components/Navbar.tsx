import Button from "./Button";

type NavbarProps = {
  userName?: string;
  userRole?: string;
  activeTab?: "map" | "events";
  onTabChange?: (tab: "map" | "events") => void;
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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-lg font-semibold text-cyan-200">
            L
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
