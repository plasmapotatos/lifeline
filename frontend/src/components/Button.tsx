import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "outline" | "ghost";
    size?: "sm" | "md";
  }
>;

/**
 * Base Button component for consistent styling across the UI.
 */
export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...rest
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-xl font-semibold transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80",
    "disabled:cursor-not-allowed disabled:opacity-60",
    size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4 text-sm",
    variant === "primary" && "bg-cyan-500/90 text-slate-950 hover:bg-cyan-400",
    variant === "outline" &&
      "border border-cyan-400/40 text-cyan-100 hover:border-cyan-300/80 hover:text-white",
    variant === "ghost" && "text-slate-200 hover:text-white",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
