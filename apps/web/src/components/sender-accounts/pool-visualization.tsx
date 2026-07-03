"use client";

import { computePoolPreview, type SenderAccount } from "@/lib/sender-accounts";

interface PoolVisualizationProps {
  accounts: SenderAccount[];
}

export function PoolVisualization({ accounts }: PoolVisualizationProps) {
  const rows = computePoolPreview(accounts);

  return (
    <section
      data-testid="pool-visualization"
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Pool preview (illustrative)
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Static demo of how leads would distribute across accounts — not live
          campaign data.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">
          Add sender accounts to see how daily capacity would be pooled.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Assigned leads today (mock)</th>
                <th className="px-3 py-2">Room left</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.accountId}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-3 py-2 text-slate-900">{row.email}</td>
                  <td className="px-3 py-2 text-slate-600">{row.assignedToday}</td>
                  <td className="px-3 py-2 text-slate-600">{row.roomLeft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
