"use client";

import { BarChart3 } from "lucide-react";

import { computePoolPreview, type SenderAccount } from "@/lib/sender-accounts";

interface PoolVisualizationProps {
  accounts: SenderAccount[];
}

export function PoolVisualization({ accounts }: PoolVisualizationProps) {
  const rows = computePoolPreview(accounts);

  return (
    <section
      data-testid="pool-visualization"
      className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-md"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-50 text-blue-600 shadow-sm ring-1 ring-blue-500/10">
          <BarChart3 className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Pool preview (illustrative)
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Illustrative static demo of how leads distribute across accounts.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/60 bg-slate-50/50 text-center px-4">
          <p className="text-sm text-slate-500 font-medium">
            Add accounts to see distribution
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.accountId}
              className="flex flex-col gap-2 rounded-xl border border-slate-200/60 bg-white/80 p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-colors hover:bg-white"
            >
              <div className="font-semibold text-slate-900 truncate text-[13px]">
                {row.email}
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                  <span>Assigned: {row.assignedToday}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                  <span>Room: {row.roomLeft}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
