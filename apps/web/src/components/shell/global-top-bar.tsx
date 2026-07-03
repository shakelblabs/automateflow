"use client";

import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Campaign Builder",
  "/sender-accounts": "Sender Accounts",
  "/template-builder": "Template Builder",
};

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.entries(PAGE_TITLES).find(([path]) =>
    path !== "/" && pathname.startsWith(path),
  );
  return match?.[1] ?? "AutomateFlow";
}

export function GlobalTopBar() {
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname);

  return (
    <header
      data-testid="global-top-bar"
      className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="font-medium text-slate-500">AutomateFlow</span>
        <span className="text-slate-300">/</span>
        <span className="truncate font-medium text-slate-900">{pageTitle}</span>
      </div>

      <button
        type="button"
        data-testid="user-menu"
        className="flex items-center gap-2 rounded-[0.625rem] px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
        title="Account menu (mock)"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
          VK
        </span>
        <span className="hidden sm:inline">Vikash</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
    </header>
  );
}
