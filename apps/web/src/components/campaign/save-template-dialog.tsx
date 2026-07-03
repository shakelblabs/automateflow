"use client";

import { useEffect, useState } from "react";
import { LayoutTemplate, X } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { Input } from "@/components/ui/input";

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

/**
 * Naming confirmation for "Save as Campaign Template" (v2 §6).
 */
export function SaveTemplateDialog({
  open,
  onClose,
  onSave,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh]"
      data-testid="save-template-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Save as Campaign Template"
        data-testid="save-template-dialog"
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
                Save as Campaign Template
              </h2>
              <p className="text-xs text-slate-500">
                Name this blueprint to reuse its structure later.
              </p>
            </div>
          </div>
          <AppButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            data-testid="save-template-cancel"
          >
            <X className="h-4 w-4" />
          </AppButton>
        </div>

        <div className="p-4">
          <label
            htmlFor="save-template-name"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            Template name
          </label>
          <Input
            id="save-template-name"
            autoFocus
            data-testid="save-template-name-input"
            value={name}
            placeholder='e.g. Standard 5-Touch Cold Outreach'
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            className="focus-visible:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4">
          <AppButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            onClick={submit}
            disabled={!name.trim()}
            data-testid="save-template-submit"
          >
            <LayoutTemplate className="h-4 w-4" />
            Save template
          </AppButton>
        </div>
      </div>
    </div>
  );
}
