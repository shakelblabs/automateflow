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
    <div className="flex min-w-[160px] flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs font-medium">
        <span className="text-slate-700">{usage}/{cap} today</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
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
        className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white/50 px-6 py-20 text-center shadow-sm backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-400/20 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 shadow-inner ring-1 ring-emerald-500/20">
            <Mail className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          No sender accounts yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Add a sender account to start configuring outbound email for your
          campaigns.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
      data-testid="sender-accounts-table"
    >
      {accounts.map((account) => (
        <div
          key={account.id}
          data-testid={`sender-account-row-${account.id}`}
          onClick={() => onSelect(account)}
          className={cn(
            "group cursor-pointer flex flex-col bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_1px_4px_-1px_rgba(0,0,0,0.02)] ring-1 ring-slate-200/50 p-5",
            "hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.1),0_4px_12px_-2px_rgba(16,185,129,0.06)] hover:ring-emerald-500/30 hover:-translate-y-1 transition-all duration-300",
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 truncate text-[15px]">
                {account.email}
              </h3>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 ml-2 uppercase text-[10px] font-bold tracking-wider rounded-md px-2 py-0.5",
                account.connectionType === "smtp"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                  : "border-blue-500/20 bg-blue-500/10 text-blue-700"
              )}
            >
              {account.connectionType}
            </Badge>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <UsageIndicator
              usage={account.mockUsageToday}
              cap={account.dailyCap}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
