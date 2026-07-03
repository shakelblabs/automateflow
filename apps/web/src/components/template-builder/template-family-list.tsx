"use client";

import type { TemplateFamilySummary } from "@/lib/template-families";

interface TemplateFamilyListProps {
  families: TemplateFamilySummary[];
  onSelectFamily: (familyId: string) => void;
}

export function TemplateFamilyList({
  families,
  onSelectFamily,
}: TemplateFamilyListProps) {
  if (families.length === 0) {
    return (
      <div
        data-testid="template-family-empty"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center"
      >
        <p className="text-sm font-medium text-slate-900">No template families yet</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Create your first family to build multi-step email sequences for
          Campaign Canvas.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="template-family-list"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {families.map((family) => (
        <button
          key={family.familyId}
          type="button"
          data-testid={`family-card-${family.familyId}`}
          onClick={() => onSelectFamily(family.familyId)}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
        >
          <p className="text-sm font-semibold text-slate-900">
            {family.familyName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {family.familySize}-Step sequence
          </p>
          <p
            className="mt-3 text-xs font-medium text-emerald-700"
            data-testid={`family-progress-${family.familyId}`}
          >
            {family.filledCount}/{family.familySize} steps filled
          </p>
        </button>
      ))}
    </div>
  );
}
