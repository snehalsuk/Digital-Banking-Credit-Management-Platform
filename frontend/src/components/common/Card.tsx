import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  hover?: boolean;
}

export function Card({ children, padded = true, hover = false, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] ${
        padded ? "p-5 sm:p-6" : ""
      } ${hover ? "transition-shadow duration-150 hover:shadow-[var(--shadow-card-hover)]" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 flex items-center justify-between gap-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-base font-semibold text-neutral-900 ${className}`}>{children}</h3>;
}
