"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Users,
  Workflow,
} from "lucide-react";

import { DeferredNavItem } from "@/components/shell/deferred-nav-item";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Campaign Builder",
    icon: Workflow,
    testId: "nav-campaign-builder",
  },
  {
    href: "/sender-accounts",
    label: "Sender Accounts",
    icon: Mail,
    testId: "nav-sender-accounts",
  },
  {
    href: "/template-builder",
    label: "Template Builder",
    icon: LayoutTemplate,
    testId: "nav-template-builder",
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-testid="app-sidebar"
      className="flex w-[68px] shrink-0 flex-col items-center border-r border-slate-200 bg-white py-3"
    >
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-[0.625rem] bg-emerald-600 text-sm font-bold text-white"
        title="AutomateFlow"
      >
        AF
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2" aria-label="Main">
        {NAV_ITEMS.map(({ href, label, icon: Icon, testId }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-[0.625rem] transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}

        <DeferredNavItem
          icon={LayoutDashboard}
          label="Dashboard"
          testId="nav-dashboard"
        />
        <DeferredNavItem
          icon={Users}
          label="Leads"
          testId="nav-leads"
        />
      </nav>
    </aside>
  );
}
