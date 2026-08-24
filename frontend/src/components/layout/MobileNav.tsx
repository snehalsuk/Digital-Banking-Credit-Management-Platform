import { useState } from "react";
import { MenuIcon, CloseIcon, BankIcon } from "../common/Icon";
import { SidebarBrand, SidebarNav, SidebarUserFooter } from "./Sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
          <BankIcon size={16} />
        </div>
        <span className="text-sm font-semibold text-neutral-900">Meridian Bank</span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
      >
        <MenuIcon size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-neutral-900/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="animate-fade-in relative flex w-72 max-w-[85vw] flex-col gap-6 bg-white px-4 py-6 shadow-xl">
            <div className="flex items-center justify-between">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
            <SidebarUserFooter />
          </div>
        </div>
      )}
    </div>
  );
}
