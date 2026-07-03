"use client";

import { Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SenderAccount } from "@/lib/sender-accounts";

interface SenderAccountListProps {
  accounts: SenderAccount[];
  onSelect: (account: SenderAccount) => void;
}

function UsageIndicator({
  usage,
  cap,
}: {
  usage: number;
  cap: number;
}) {
  const percent = cap > 0 ? Math.min(100, (usage / cap) * 100) : 0;

  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <span className="text-xs text-slate-600">
        {usage}/{cap} today
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function SenderAccountList({
  accounts,
  onSelect,
}: SenderAccountListProps) {
  if (accounts.length === 0) {
    return (
      <div
        data-testid="sender-accounts-empty"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-sm font-semibold text-slate-900">
          No sender accounts yet
        </h2>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Add a sender account to start configuring outbound email for your
          campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm" data-testid="sender-accounts-table">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Connection</th>
            <th className="px-4 py-3">Daily cap</th>
            <th className="px-4 py-3">Usage today</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr
              key={account.id}
              data-testid={`sender-account-row-${account.id}`}
              onClick={() => onSelect(account)}
              className={cn(
                "cursor-pointer border-b border-slate-100 last:border-b-0",
                "hover:bg-emerald-50/40",
              )}
            >
              <td className="px-4 py-3 font-medium text-slate-900">
                {account.email}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 uppercase"
                >
                  {account.connectionType}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">{account.dailyCap}</td>
              <td className="px-4 py-3">
                <UsageIndicator
                  usage={account.mockUsageToday}
                  cap={account.dailyCap}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
