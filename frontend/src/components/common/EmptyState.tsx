import type { ReactNode } from "react";
import { InboxIcon } from "./Icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
  positive = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 px-6 py-12 text-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          positive ? "bg-success-50 text-success-600" : "bg-neutral-100 text-neutral-400"
        }`}
      >
        {icon ?? <InboxIcon size={22} />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
