import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="scroll-x rounded-xl border border-neutral-200">
      <table className="w-full min-w-max border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold whitespace-nowrap ${className}`}>{children}</th>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-neutral-100 bg-white">{children}</tbody>;
}

export function Tr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`transition-colors hover:bg-neutral-50 ${className}`}>{children}</tr>;
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle whitespace-nowrap text-neutral-700 ${className}`}>{children}</td>;
}

export function TableSkeleton({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <TBody>
      {Array.from({ length: rows }).map((_, r) => (
        <Tr key={r} className="hover:bg-transparent">
          {Array.from({ length: cols }).map((_, c) => (
            <Td key={c}>
              <div className="h-3.5 w-full max-w-[8rem] animate-pulse rounded bg-neutral-200" />
            </Td>
          ))}
        </Tr>
      ))}
    </TBody>
  );
}
