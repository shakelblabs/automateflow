"use client";

import { Plus } from "lucide-react";

import { AppButton } from "@/components/app-button";

interface TemplateBuilderHeaderProps {
  onCreateFamily: () => void;
  showCreate?: boolean;
}

export function TemplateBuilderHeader({
  onCreateFamily,
  showCreate = true,
}: TemplateBuilderHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div>
        <h1 className="text-base font-semibold text-slate-900">
          Template Builder
        </h1>
        <p className="text-xs text-slate-500">
          Create and manage email template families for your campaigns
        </p>
      </div>
      {showCreate ? (
        <AppButton
          variant="primary"
          size="sm"
          onClick={onCreateFamily}
          data-testid="create-new-family"
        >
          <Plus className="h-4 w-4" />
          Create New Family
        </AppButton>
      ) : null}
    </header>
  );
}
