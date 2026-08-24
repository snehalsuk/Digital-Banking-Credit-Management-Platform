import type { ReactNode } from "react";
import { BankIcon } from "../common/Icon";

export function AuthLayout({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
            <BankIcon size={22} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-neutral-900">Midnight Bank</span>
        </div>
        <div className="animate-fade-in rounded-2xl border border-neutral-200 bg-white p-7 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
            {description && <p className="mt-1.5 text-sm text-neutral-500">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
