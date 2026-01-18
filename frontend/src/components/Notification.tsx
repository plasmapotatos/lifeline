import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "./Button";

type NotificationType = "alert" | "success" | "info" | "warning";

type NotificationProps = {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
};

type NotificationItem = {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
};

type NotificationStackProps = {
  items: NotificationItem[];
  onDismiss: (id: string) => void;
};

const stylesByType: Record<NotificationType, string> = {
  alert: "border-red-500/40 bg-red-500/10 text-red-100",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-100",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
};

const buttonByType: Record<NotificationType, string> = {
  alert: "text-red-100 hover:text-white",
  success: "text-emerald-100 hover:text-white",
  info: "text-cyan-100 hover:text-white",
  warning: "text-amber-100 hover:text-white",
};

/**
 * Single notification with animated entry/exit.
 */
export function Notification({
  message,
  type,
  onClose,
  duration,
}: NotificationProps) {
  useEffect(() => {
    if (!duration) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${stylesByType[type]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{message}</p>
        <Button
          variant="ghost"
          size="sm"
          className={buttonByType[type]}
          onClick={onClose}
        >
          Dismiss
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Stacked notifications container (renders multiple Notification entries).
 */
export function NotificationStack({
  items,
  onDismiss,
}: NotificationStackProps) {
  if (!items.length) return null;

  return (
    <div className="pointer-events-none absolute left-6 top-20 z-20 flex w-[320px] flex-col gap-3">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <Notification
            key={item.id}
            message={item.message}
            type={item.type}
            duration={item.duration}
            onClose={() => onDismiss(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Example usage:
 * <NotificationStack
 *   items={[{ id: "1", message: "Unit dispatched", type: "success", duration: 4000 }]}
 *   onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
 * />
 */
export type { NotificationItem, NotificationType };
