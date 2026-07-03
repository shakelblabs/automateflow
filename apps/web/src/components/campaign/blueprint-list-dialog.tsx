"use client";

import { useEffect } from "react";
import { LayoutTemplate, X } from "lucide-react";

import { AppButton } from "@/components/app-button";
import type { CampaignBlueprint } from "@automateflow/shared-types";

interface BlueprintListDialogProps {
  open: boolean;
  blueprints: CampaignBlueprint[];
  onClose: () => void;
}

function formatSavedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Read-only list of saved campaign blueprints (v2 §6). Proves save worked;
 * load/apply flow is explicitly out of scope this version.
 */
export function BlueprintListDialog({
  open,
  blueprints,
  onClose,
}: BlueprintListDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh]"
      data-testid="blueprint-list-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Saved Campaign Templates"
        data-testid="blueprint-list-dialog"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <LayoutTemplate className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Saved Campaign Templates
              </h2>
              <p className="text-xs text-slate-500">
                Blueprints saved this session — read-only.
              </p>
            </div>
          </div>
          <AppButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            data-testid="blueprint-list-close"
          >
            <X className="h-4 w-4" />
          </AppButton>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-4">
          {blueprints.length === 0 ? (
            <p
              className="py-6 text-center text-sm text-slate-500"
              data-testid="blueprint-list-empty"
            >
              No templates saved yet. Use &ldquo;Save as Campaign Template&rdquo; to
              create one.
            </p>
          ) : (
            <ul className="space-y-2" data-testid="blueprint-list">
              {blueprints.map((blueprint) => (
                <li
                  key={blueprint.id}
                  data-testid={`blueprint-item-${blueprint.id}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {blueprint.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {blueprint.nodes.length} step
                    {blueprint.nodes.length === 1 ? "" : "s"} · Saved{" "}
                    {formatSavedAt(blueprint.savedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 p-4">
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            Close
          </AppButton>
        </div>
      </div>
    </div>
  );
}
