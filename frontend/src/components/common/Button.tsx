import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { SpinnerIcon } from "./Icon";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white border border-primary-600 hover:bg-primary-700 hover:border-primary-700 shadow-sm disabled:hover:bg-primary-600",
  secondary:
    "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 shadow-sm disabled:hover:bg-white",
  danger:
    "bg-danger-600 text-white border border-danger-600 hover:bg-danger-700 hover:border-danger-700 shadow-sm disabled:hover:bg-danger-600",
  ghost:
    "bg-transparent text-neutral-600 border border-transparent hover:bg-neutral-100 hover:text-neutral-900 disabled:hover:bg-transparent",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 gap-2 rounded-xl",
  lg: "text-base px-5 py-3 gap-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, fullWidth = false, disabled, className = "", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
        VARIANT_CLASSES[variant]
      } ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? <SpinnerIcon size={size === "sm" ? 14 : 16} /> : icon}
      {children}
    </button>
  );
});
