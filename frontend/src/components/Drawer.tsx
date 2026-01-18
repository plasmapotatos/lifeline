import type { PropsWithChildren } from "react";
import Button from "./Button";

type DrawerProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
}>;

/**
 * Right-hand drawer used to display detailed entity information.
 */
export default function Drawer({
  title,
  subtitle,
  isOpen,
  onClose,
  children,
}: DrawerProps) {
  return (
    <aside
      className={
        "absolute right-0 top-0 h-full w-90 border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur transition-transform duration-300" +
        (isOpen ? " translate-x-0" : " translate-x-full")
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">
              Lifeline Detail
            </p>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-slate-200">
          {children}
        </div>
      </div>
    </aside>
  );
}
