"use client";

import { Plus } from "lucide-react";

import { AppButton } from "@/components/app-button";

interface SenderAccountsHeaderProps {
  onAdd: () => void;
}

export function SenderAccountsHeader({ onAdd }: SenderAccountsHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div>
        <h1 className="text-base font-semibold text-slate-900">Sender Accounts</h1>
        <p className="text-xs text-slate-500">
          Manage outbound email accounts and daily send limits
        </p>
      </div>
      <AppButton
        variant="primary"
        size="sm"
        onClick={onAdd}
        data-testid="add-sender-account"
      >
        <Plus className="h-4 w-4" />
        Add Sender Account
      </AppButton>
    </header>
  );
}
