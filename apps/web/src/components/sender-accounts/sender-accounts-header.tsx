"use client";

import { Plus, Server } from "lucide-react";

import { AppButton } from "@/components/app-button";

import type { SenderAccount } from "@/lib/sender-accounts";

interface SenderAccountsHeaderProps {
  onAdd: () => void;
  accounts: SenderAccount[];
}

export function SenderAccountsHeader({ onAdd, accounts }: SenderAccountsHeaderProps) {
  const totalCapacity = accounts.reduce((sum, acc) => sum + acc.dailyCap, 0);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 shadow-sm ring-1 ring-emerald-500/10">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Sender Accounts
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Manage outbound email accounts and daily send limits
            </p>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-slate-200 md:block" />

        <div className="hidden md:flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Capacity
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {totalCapacity.toLocaleString()} <span className="text-slate-400 font-medium">msgs / day</span>
          </span>
        </div>
      </div>
      <AppButton
        variant="primary"
        size="sm"
        onClick={onAdd}
        data-testid="add-sender-account"
        className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all border-0 h-9 px-4"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Sender Account
      </AppButton>
    </header>
  );
}
