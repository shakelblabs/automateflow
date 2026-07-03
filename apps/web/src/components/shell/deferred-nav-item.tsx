"use client";

import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

interface DeferredNavItemProps {
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  testId: string;
}

export function DeferredNavItem({
  icon: Icon,
  label,
  tooltip = "Coming soon",
  testId,
}: DeferredNavItemProps) {
  return (
    <div
      data-testid={testId}
      title={tooltip}
      aria-disabled="true"
      aria-label={label}
      className={cn(
        "relative flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-[0.625rem]",
        "border border-dashed border-slate-200 bg-slate-50 opacity-60 select-none",
      )}
    >
      <Lock className="absolute h-2.5 w-2.5 translate-x-3 -translate-y-3 text-slate-400" />
      <Icon className="h-5 w-5 text-slate-400" />
    </div>
  );
}
