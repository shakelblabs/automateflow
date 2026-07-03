"use client";

import { AlertTriangle } from "lucide-react";

import type { ValidationIssue } from "@/lib/validation";

/**
 * Non-blocking validation banner (Section 3) — never a modal. Overlays the top
 * of the canvas and lists live warnings. Renders nothing when the canvas is valid.
 */
export function ValidationBanner({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <div
      data-testid="validation-banner"
      className="pointer-events-none absolute top-3 left-1/2 z-10 w-[min(560px,90%)] -translate-x-1/2"
    >
      <div className="rounded-[0.625rem] border border-amber-200 bg-amber-50/95 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-xs font-semibold">
            {issues.length} validation {issues.length === 1 ? "warning" : "warnings"}
          </p>
        </div>
        <ul className="mt-1.5 space-y-1">
          {issues.map((issue, index) => (
            <li
              key={`${issue.code}-${issue.nodeId ?? index}`}
              data-testid={`validation-${issue.code}`}
              className="flex items-start gap-1.5 text-xs text-amber-700"
            >
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
              {issue.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
