"use client";

import { Plus } from "lucide-react";

import type { TemplateFamilySummary } from "@/lib/template-families";

interface TemplateFamilyListProps {
  families: TemplateFamilySummary[];
  activeFamilyId: string | null;
  onSelectFamily: (familyId: string) => void;
  onCreateFamily: () => void;
}

export function TemplateFamilyList({
  families,
  activeFamilyId,
  onSelectFamily,
  onCreateFamily,
}: TemplateFamilyListProps) {
  return (
    <div className="flex h-full w-72 lg:w-80 shrink-0 flex-col border-r border-slate-200 bg-slate-50/50">
      <div className="flex items-center justify-between p-4 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Sequences
        </h2>
        <button
          type="button"
          data-testid="create-new-family"
          onClick={onCreateFamily}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-200 hover:text-emerald-800"
          title="Create New Sequence"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {families.length === 0 ? (
          <div
            data-testid="template-family-empty"
            className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center"
          >
            <p className="text-sm font-medium text-slate-700">No sequences</p>
            <p className="mt-1 text-xs text-slate-500">
              Click the + button to create a new multi-step sequence.
            </p>
          </div>
        ) : (
          <div data-testid="template-family-list" className="space-y-1.5">
            {families.map((family) => {
              const isActive = family.familyId === activeFamilyId;
              const progressPct = Math.round(
                (family.filledCount / family.familySize) * 100,
              );

              return (
                <button
                  key={family.familyId}
                  type="button"
                  data-testid={`family-card-${family.familyId}`}
                  onClick={() => onSelectFamily(family.familyId)}
                  className={`relative flex w-full flex-col overflow-hidden rounded-xl border p-3 text-left transition-all ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-300"
                      : "border-transparent bg-transparent hover:bg-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`truncate text-sm font-semibold ${isActive ? "text-emerald-900" : "text-slate-700"}`}
                    >
                      {family.familyName}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {family.familySize}-Step sequence
                  </p>

                  {/* Sleek horizontal progress bar */}
                  <div
                    className="mt-3 flex items-center justify-between"
                    data-testid={`family-progress-${family.familyId}`}
                  >
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="ml-2 text-[10px] font-medium text-slate-500">
                      {family.filledCount}/{family.familySize}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
